# ---------------------------------------------------------------------
# Build configuration
# ---------------------------------------------------------------------

# This directory will be completely deleted by the `clean` rule
BUILD_DIRECTORY ?= release

# See http://stackoverflow.com/a/20763842/1641422
BUILD_DIRECTORY_PARENT = $(dir $(BUILD_DIRECTORY))
ifeq ($(wildcard $(BUILD_DIRECTORY_PARENT).),)
$(error $(BUILD_DIRECTORY_PARENT) does not exist)
endif

BUILD_TEMPORARY_DIRECTORY = $(BUILD_DIRECTORY)/.tmp
BUILD_OUTPUT_DIRECTORY = $(BUILD_DIRECTORY)/out

# ---------------------------------------------------------------------
# Application configuration
# ---------------------------------------------------------------------

ELECTRON_VERSION = $(shell jq -r '.devDependencies["electron"]' package.json)
NODE_VERSION = 6.1.0
COMPANY_NAME = $(shell jq -r '.companyName' package.json)
APPLICATION_NAME = $(shell jq -r '.displayName' package.json)
APPLICATION_DESCRIPTION = $(shell jq -r '.description' package.json)
APPLICATION_COPYRIGHT = $(shell jq -r '.build.copyright' package.json)

# Add the current commit to the version if release type is "snapshot"
RELEASE_TYPE ?= snapshot
PACKAGE_JSON_VERSION = $(shell jq -r '.version' package.json)
ifeq ($(RELEASE_TYPE),production)
APPLICATION_VERSION = $(PACKAGE_JSON_VERSION)
endif
ifeq ($(RELEASE_TYPE),snapshot)
CURRENT_COMMIT_HASH = $(shell git log -1 --format="%h")
APPLICATION_VERSION = $(PACKAGE_JSON_VERSION)+$(CURRENT_COMMIT_HASH)
endif
ifndef APPLICATION_VERSION
$(error Invalid release type: $(RELEASE_TYPE))
endif

# ---------------------------------------------------------------------
# Operating system and architecture detection
# ---------------------------------------------------------------------

# http://stackoverflow.com/a/12099167
ifeq ($(OS),Windows_NT)
	HOST_PLATFORM = win32

	ifeq ($(PROCESSOR_ARCHITEW6432),AMD64)
		HOST_ARCH = x64
	else
		ifeq ($(PROCESSOR_ARCHITECTURE),AMD64)
			HOST_ARCH = x64
		endif
		ifeq ($(PROCESSOR_ARCHITECTURE),x86)
			HOST_ARCH = x86
		endif
	endif
else
	ifeq ($(shell uname -s),Linux)
		HOST_PLATFORM = linux

		ifeq ($(shell uname -m),x86_64)
			HOST_ARCH = x64
		endif
		ifneq ($(filter %86,$(shell uname -m)),)
			HOST_ARCH = x86
		endif
		ifeq ($(shell uname -m),armv7l)
			HOST_ARCH = armv7l
		endif
	endif
	ifeq ($(shell uname -s),Darwin)
		HOST_PLATFORM = darwin

		ifeq ($(shell uname -m),x86_64)
			HOST_ARCH = x64
		endif
	endif
endif

ifndef HOST_PLATFORM
$(error We couldn't detect your host platform)
endif
ifndef HOST_ARCH
$(error We couldn't detect your host architecture)
endif

TARGET_PLATFORM = $(HOST_PLATFORM)

ifneq ($(TARGET_PLATFORM),$(HOST_PLATFORM))
$(error We don't support cross-platform builds yet)
endif

# Default to host architecture. You can override by doing:
#
#   make <target> TARGET_ARCH=<arch>
#
TARGET_ARCH ?= $(HOST_ARCH)

# Support x86 builds from x64 in GNU/Linux
# See https://github.com/addaleax/lzma-native/issues/27
ifeq ($(TARGET_PLATFORM),linux)
	ifneq ($(HOST_ARCH),$(TARGET_ARCH))
		ifeq ($(TARGET_ARCH),x86)
			export CFLAGS += -m32
		else
$(error Can't build $(TARGET_ARCH) binaries on a $(HOST_ARCH) host)
		endif
	endif
endif

# ---------------------------------------------------------------------
# Code signing
# ---------------------------------------------------------------------

ifeq ($(TARGET_PLATFORM),darwin)
ifndef CODE_SIGN_IDENTITY
$(warning No code-sign identity found (CODE_SIGN_IDENTITY is not set))
endif
endif

ifeq ($(TARGET_PLATFORM),win32)
ifndef CODE_SIGN_CERTIFICATE
$(warning No code-sign certificate found (CODE_SIGN_CERTIFICATE is not set))
ifndef CODE_SIGN_CERTIFICATE_PASSWORD
$(warning No code-sign certificate password found (CODE_SIGN_CERTIFICATE_PASSWORD is not set))
endif
endif
endif

# ---------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------

ifndef ANALYTICS_SENTRY_TOKEN
$(warning No Sentry token found (ANALYTICS_SENTRY_TOKEN is not set))
endif

ifndef ANALYTICS_MIXPANEL_TOKEN
$(warning No Mixpanel token found (ANALYTICS_MIXPANEL_TOKEN is not set))
endif

# ---------------------------------------------------------------------
# Extra variables
# ---------------------------------------------------------------------

# Fix hard link Appveyor issues
CPRF = cp -RLf

# ---------------------------------------------------------------------
# Rules
# ---------------------------------------------------------------------

$(BUILD_DIRECTORY)/node-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies: package.json npm-shrinkwrap.json \
	| $(BUILD_DIRECTORY)
	mkdir $@
	./scripts/build/dependencies-npm.sh -p \
		-r "$(TARGET_ARCH)" \
		-v "$(NODE_VERSION)" \
		-x $@ \
		-t node \
		-s "$(TARGET_PLATFORM)"
	git apply --directory $@/node_modules/lzma-native patches/cli/lzma-native-index-static-addon-require.patch

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH)-app: \
	package.json lib \
	$(BUILD_DIRECTORY)/node-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies \
	| $(BUILD_DIRECTORY)
	mkdir $@
	cp $(word 1,$^) $@
	$(CPRF) $(word 2,$^) $@
	$(CPRF) $(word 3,$^)/* $@

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH).js: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH)-app \
	| $(BUILD_DIRECTORY)
	./scripts/build/concatenate-javascript.sh -e lib/cli/etcher.js -b $< -o $@ -m

$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH): \
	$(BUILD_DIRECTORY)/node-$(TARGET_PLATFORM)-$(TARGET_ARCH)-dependencies \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(TARGET_PLATFORM)-$(APPLICATION_VERSION)-$(TARGET_ARCH).js \
	| $(BUILD_DIRECTORY) $(BUILD_TEMPORARY_DIRECTORY)
	./scripts/build/node-package-cli.sh -o $@ -l $</node_modules \
		-n $(APPLICATION_NAME) \
		-e $(word 2,$^) \
		-r $(TARGET_ARCH) \
		-s $(TARGET_PLATFORM)

ifeq ($(TARGET_PLATFORM),win32)
	./scripts/build/electron-brand-exe.sh \
		-f $@/etcher.exe \
		-n $(APPLICATION_NAME) \
		-d "$(APPLICATION_DESCRIPTION)" \
		-v "$(APPLICATION_VERSION)" \
		-c "$(APPLICATION_COPYRIGHT)" \
		-m "$(COMPANY_NAME)" \
		-i assets/icon.ico \
		-w $(BUILD_TEMPORARY_DIRECTORY)
endif

ifeq ($(TARGET_PLATFORM),darwin)
ifdef CODE_SIGN_IDENTITY
	./scripts/build/electron-sign-file-darwin.sh -f $@/etcher -i "$(CODE_SIGN_IDENTITY)"
endif
endif

ifeq ($(TARGET_PLATFORM),win32)
ifdef CODE_SIGN_CERTIFICATE
ifdef CODE_SIGN_CERTIFICATE_PASSWORD
	./scripts/build/electron-sign-exe-win32.sh -f $@/etcher.exe \
		-d "$(APPLICATION_NAME) - $(APPLICATION_VERSION)" \
		-c $(CODE_SIGN_CERTIFICATE) \
		-p $(CODE_SIGN_CERTIFICATE_PASSWORD)
endif
endif
endif

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH) \
	| $(BUILD_OUTPUT_DIRECTORY)
	./scripts/build/zip-file.sh -f $< -s $(TARGET_PLATFORM) -o $@

$(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz: \
	$(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH) \
	| $(BUILD_OUTPUT_DIRECTORY)
	./scripts/build/tar-gz-file.sh -f $< -o $@

package-cli: $(BUILD_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH)

ifeq ($(TARGET_PLATFORM),win32)
cli-installer-zip: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).zip
else
cli-installer-tar-gz: $(BUILD_OUTPUT_DIRECTORY)/$(APPLICATION_NAME)-cli-$(APPLICATION_VERSION)-$(TARGET_PLATFORM)-$(TARGET_ARCH).tar.gz
endif

cli-develop:
	./scripts/build/dependencies-npm.sh \
		-r "$(TARGET_ARCH)" \
		-v "$(NODE_VERSION)" \
		-t node \
		-s "$(TARGET_PLATFORM)"

# ---------------------------------------------------------------------
# Electron
# ---------------------------------------------------------------------

ELECTRON_BUILDER_OPTIONS=--$(TARGET_ARCH) --extraMetadata.version=$(APPLICATION_VERSION)

ifdef ANALYTICS_SENTRY_TOKEN
ELECTRON_BUILDER_OPTIONS+= --extraMetadata.analytics.sentry.token=$(ANALYTICS_SENTRY_TOKEN)
endif

ifdef ANALYTICS_MIXPANEL_TOKEN
ELECTRON_BUILDER_OPTIONS+= --extraMetadata.analytics.mixpanel.token=$(ANALYTICS_MIXPANEL_TOKEN)
endif

package-electron:
	PATH=$(PATH):./node_modules/.bin build --dir $(ELECTRON_BUILDER_OPTIONS)

ifeq ($(TARGET_PLATFORM),darwin)
electron-installer-dmg:
	PATH=$(PATH):./node_modules/.bin build --mac dmg $(ELECTRON_BUILDER_OPTIONS)
electron-installer-app-zip:
	PATH=$(PATH):./node_modules/.bin build --mac zip $(ELECTRON_BUILDER_OPTIONS)
endif

ifeq ($(TARGET_PLATFORM),linux)
electron-installer-appimage:
	PATH=$(PATH):./node_modules/.bin build --linux AppImage $(ELECTRON_BUILDER_OPTIONS)
electron-installer-debian:
	PATH=$(PATH):./node_modules/.bin build --linux deb $(ELECTRON_BUILDER_OPTIONS)
electron-installer-rpm:
	PATH=$(PATH):./node_modules/.bin build --linux rpm $(ELECTRON_BUILDER_OPTIONS)
endif

ifeq ($(TARGET_PLATFORM),win32)
electron-installer-portable:
	PATH=$(PATH):./node_modules/.bin build --win portable $(ELECTRON_BUILDER_OPTIONS)
electron-installer-squirrel:
	PATH=$(PATH):./node_modules/.bin build --win squirrel $(ELECTRON_BUILDER_OPTIONS)
endif

electron-develop:
	./scripts/build/dependencies-npm.sh \
		-r "$(TARGET_ARCH)" \
		-v "$(ELECTRON_VERSION)" \
		-t electron \
		-s "$(TARGET_PLATFORM)"

help:
	@echo "Available targets: $(TARGETS)"

info:
	@echo "Application version : $(APPLICATION_VERSION)"
	@echo "Release type        : $(RELEASE_TYPE)"
	@echo "Host platform       : $(HOST_PLATFORM)"
	@echo "Host arch           : $(HOST_ARCH)"
	@echo "Target platform     : $(TARGET_PLATFORM)"
	@echo "Target arch         : $(TARGET_ARCH)"

sanity-checks:
	./scripts/ci/ensure-all-node-requirements-available.sh
	./scripts/ci/ensure-staged-sass.sh
	./scripts/ci/ensure-staged-shrinkwrap.sh
	./scripts/ci/ensure-npm-dependencies-compatibility.sh
	./scripts/ci/ensure-npm-valid-dependencies.sh
	./scripts/ci/ensure-npm-shrinkwrap-versions.sh
	./scripts/ci/ensure-all-file-extensions-in-gitattributes.sh
	./scripts/ci/ensure-all-text-files-only-ascii.sh

clean:
	rm -rf $(BUILD_DIRECTORY)

distclean: clean
	rm -rf node_modules

.DEFAULT_GOAL = help
