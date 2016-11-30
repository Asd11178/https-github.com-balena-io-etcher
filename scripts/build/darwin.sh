#!/bin/bash

###
# Copyright 2016 resin.io
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###

# See http://www.davidpashley.com/articles/writing-robust-shell-scripts/
set -u
set -e
set -x

function check_dep() {
  if ! command -v $1 2>/dev/null 1>&2; then
    echo "Dependency missing: $1" 1>&2
    exit 1
  fi
}

function get_package_setting() {
  node -e "console.log(require('./package.json').$1)"
}

OS=$(uname)
if [[ "$OS" != "Darwin" ]]; then
  echo "This script is only meant to be run in OS X" 1>&2
  exit 1
fi
APPLICATION_OS=darwin

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <command>" 1>&2
  exit 1
fi

COMMAND=$1
ARCH=x64

SIGN_IDENTITY_OSX="Developer ID Application: Rulemotion Ltd (66H43P8FRG)"
ELECTRON_VERSION=$(get_package_setting "devDependencies['electron-prebuilt']")
NODE_VERSION=6.2.2
APPLICATION_NAME=$(get_package_setting "displayName")
APPLICATION_COPYRIGHT=$(get_package_setting "copyright")
APPLICATION_DESCRIPTION=$(get_package_setting "description")
APPLICATION_VERSION=$(get_package_setting "version")
GUI_APPLICATION_NAME=$APPLICATION_NAME-$APPLICATION_OS-$ARCH
CLI_APPLICATION_NAME=etcher-cli-$APPLICATION_OS-$ARCH
PACKAGE_NAME=$APPLICATION_NAME-$APPLICATION_VERSION-$APPLICATION_OS-$ARCH
OUTPUT_BUILD_DIRECTORY=etcher-release
OUTPUT_DIRECTORY=$OUTPUT_BUILD_DIRECTORY/installers

if [ "$COMMAND" == "develop-electron" ]; then
  ./scripts/unix/dependencies.sh \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron
  exit 0
fi

if [ "$COMMAND" == "develop-cli" ]; then
  ./scripts/unix/dependencies.sh \
    -r "$ARCH" \
    -v "$NODE_VERSION" \
    -t node
  exit 0
fi

if [ "$COMMAND" == "installer-cli" ]; then
  ./scripts/unix/dependencies.sh -f -p \
    -r "$ARCH" \
    -v "$NODE_VERSION" \
    -t node

  ./scripts/unix/package-cli.sh \
    -n etcher \
    -e bin/etcher \
    -r "$ARCH" \
    -s "$APPLICATION_OS" \
    -o "$OUTPUT_BUILD_DIRECTORY/$CLI_APPLICATION_NAME"
  exit 0
fi

if [ "$COMMAND" == "installer-dmg" ]; then
  ./scripts/unix/dependencies.sh -p \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron

  ./scripts/$APPLICATION_OS/package.sh \
    -n "$APPLICATION_NAME" \
    -r "$ARCH" \
    -v "$APPLICATION_VERSION" \
    -b io.resin.etcher \
    -c "$APPLICATION_COPYRIGHT" \
    -t public.app-category.developer-tools \
    -f "package.json,lib,node_modules,bower_components,build,assets" \
    -i assets/icon.icns \
    -e "$ELECTRON_VERSION" \
    -o "$OUTPUT_BUILD_DIRECTORY/$GUI_APPLICATION_NAME"

  ./scripts/$APPLICATION_OS/installer-dmg.sh \
    -n "$APPLICATION_NAME" \
    -v "$APPLICATION_VERSION" \
    -p "$OUTPUT_BUILD_DIRECTORY/$GUI_APPLICATION_NAME" \
    -d "$SIGN_IDENTITY_OSX" \
    -i assets/icon.icns \
    -b assets/osx/installer.png \
    -o "$OUTPUT_DIRECTORY/$PACKAGE_NAME.dmg"

  exit 0
fi

if [ "$COMMAND" == "installer-zip" ]; then
  ./scripts/unix/dependencies.sh -p \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron

  ./scripts/$APPLICATION_OS/package.sh \
    -n "$APPLICATION_NAME" \
    -r "$ARCH" \
    -v "$APPLICATION_VERSION" \
    -b io.resin.etcher \
    -c "$APPLICATION_COPYRIGHT" \
    -t public.app-category.developer-tools \
    -f "package.json,lib,node_modules,bower_components,build,assets" \
    -i assets/icon.icns \
    -e "$ELECTRON_VERSION" \
    -o "$OUTPUT_BUILD_DIRECTORY/$GUI_APPLICATION_NAME"

  ./scripts/$APPLICATION_OS/sign.sh \
    -a "$OUTPUT_BUILD_DIRECTORY/$GUI_APPLICATION_NAME/$APPLICATION_NAME.app" \
    -i "$SIGN_IDENTITY_OSX"

  ./scripts/$APPLICATION_OS/installer-zip.sh \
    -a "$OUTPUT_BUILD_DIRECTORY/$GUI_APPLICATION_NAME/$APPLICATION_NAME.app" \
    -o "$OUTPUT_DIRECTORY/$PACKAGE_NAME.zip"

  exit 0
fi

echo "Unknown command: $COMMAND" 1>&2
exit 1
