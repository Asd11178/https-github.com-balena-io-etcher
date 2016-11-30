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
if [[ "$OS" != "Linux" ]]; then
  echo "This script is only meant to be run in GNU/Linux" 1>&2
  exit 1
fi
APPLICATION_OS=linux

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <command> <arch>" 1>&2
  exit 1
fi

COMMAND=$1
ARCH=$2
if [ "$ARCH" != "x64" ] &&
   [ "$ARCH" != "x86" ];
then
  echo "Unknown architecture: $ARCH" 1>&2
  exit 1
fi

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

if [ "$COMMAND" == "installer-debian" ]; then
  ./scripts/unix/dependencies.sh -p \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron

  ./scripts/$APPLICATION_OS/package.sh \
    -n "$APPLICATION_NAME" \
    -r "$ARCH" \
    -v "$APPLICATION_VERSION" \
    -l LICENSE \
    -f "package.json,lib,node_modules,bower_components,build,assets" \
    -e "$ELECTRON_VERSION" \
    -o "$OUTPUT_BUILD_DIRECTORY/$GUI_APPLICATION_NAME"

  ./scripts/$APPLICATION_OS/installer-deb.sh \
    -p "$OUTPUT_BUILD_DIRECTORY/GUI_APPLICATION_NAME" \
    -r "$ARCH" \
    -c scripts/build/debian/config.json \
    -o "$OUTPUT_DIRECTORY"

  exit 0
fi

if [ "$COMMAND" == "installer-appimage" ]; then
  check_dep zip

  ./scripts/unix/dependencies.sh -p \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron

  ./scripts/$APPLICATION_OS/package.sh \
    -n "$APPLICATION_NAME" \
    -r "$ARCH" \
    -v "$APPLICATION_VERSION" \
    -l LICENSE \
    -f "package.json,lib,node_modules,bower_components,build,assets" \
    -e "$ELECTRON_VERSION" \
    -o "$OUTPUT_BUILD_DIRECTORY/$GUI_APPLICATION_NAME"

  ./scripts/$APPLICATION_OS/installer-appimage.sh \
    -n "$APPLICATION_NAME" \
    -d "$APPLICATION_DESCRIPTION" \
    -p "$OUTPUT_BUILD_DIRECTORY/$GUI_APPLICATION_NAME" \
    -r "$ARCH" \
    -b etcher \
    -i assets/icon.png \
    -o "$OUTPUT_BUILD_DIRECTORY/$GUI_APPLICATION_NAME.AppImage"

  pushd "$OUTPUT_BUILD_DIRECTORY"
  zip "$PACKAGE_NAME.zip" "$GUI_APPLICATION_NAME.AppImage"
  popd
  mkdir -p "$OUTPUT_DIRECTORY"
  mv "$OUTPUT_BUILD_DIRECTORY/$PACKAGE_NAME.zip" "$OUTPUT_DIRECTORY"

  exit 0
fi

echo "Unknown command: $COMMAND" 1>&2
exit 1
