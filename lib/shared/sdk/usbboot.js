/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * This work is heavily based on https://github.com/raspberrypi/usbboot
 * Copyright 2016 Raspberry Pi Foundation
 */

'use strict'

const _ = require('lodash')
const Bluebird = require('bluebird')
const usb = require('usb')
const debug = require('debug')('sdk:usbboot')
const usbUtils = require('./utils/usb-utils')

// The equivalent of a NULL buffer, given that node-usb complains
// if the daata argument is not an instance of Buffer
const NULL_BUFFER_SIZE = 0
const NULL_BUFFER = Buffer.alloc(NULL_BUFFER_SIZE)

/**
 * @summary The number of USB interfaces in devices with a BCM2837 SoC
 * @description
 * Raspberry Pi 3, and CM3 use this SoC.
 * @type {Number}
 * @constant
 */
const INTERFACES_SOC_BCM2837 = 1

/**
 * @summary Vendor ID of "Broadcom Corporation"
 * @type {Number}
 * @constant
 */
const USB_VENDOR_ID_BROADCOM_CORPORATION = 0x0a5c

/**
 * @summary List of usbboot capable devices
 * @type {Object[]}
 * @constant
 */
const USBBOOT_CAPABLE_USB_DEVICES = [

  // Raspberry Pi 1

  {
    vendorID: USB_VENDOR_ID_BROADCOM_CORPORATION,
    productID: 0x2763
  },

  // Raspberry Pi 2 & 3

  {
    vendorID: USB_VENDOR_ID_BROADCOM_CORPORATION,
    productID: 0x2764
  }

]

/**
 * @summary The size of the boot message bootcode length section
 * @type {Number}
 * @constant
 */
const BOOT_MESSAGE_BOOTCODE_LENGTH_SIZE = 4

/**
 * @summary The offset of the boot message bootcode length section
 * @type {Number}
 * @constant
 */
const BOOT_MESSAGE_BOOTCODE_LENGTH_OFFSET = 0

/**
 * @summary The size of the boot message signature section
 * @type {Number}
 * @constant
 */
const BOOT_MESSAGE_SIGNATURE_SIZE = 20

/**
 * @summary The delay to wait between each USB read/write operation
 * @type {Number}
 * @constant
 * @description
 * The USB bus seems to hang if we execute many operations at
 * the same time.
 */
const USB_OPERATION_DELAY_MS = 1000

/**
 * @summary The GET_STATUS usb control transfer request code
 * @type {Number}
 * @constant
 * @description
 * See http://www.jungo.com/st/support/documentation/windriver/811/wdusb_man_mhtml/node55.html#usb_standard_dev_req_codes
 */
const USB_REQUEST_CODE_GET_STATUS = 0

/**
 * @summary The maximum buffer length of a usbboot message
 * @type {Number}
 * @constant
 */
const USBBOOT_MESSAGE_MAX_BUFFER_LENGTH = 0xffff

/**
 * @summary The buffer length of the usbboot return code message
 * @type {Number}
 * @constant
 */
const USBBOOT_RETURN_CODE_LENGTH = 4

/**
 * @summary The USB device descriptor index of an empty property
 * @type {Number}
 * @constant
 */
const USB_DESCRIPTOR_NULL_INDEX = 0

/**
 * @summary Check if a node-usb device object is usbboot-capable
 * @function
 * @private
 *
 * @param {Object} device - device
 * @returns {Boolean} whether the device is usbboot-capable
 *
 * @example
 * if (isUsbBootCapableUSBDevice({ ... })) {
 *   console.log('We can use usbboot on this device')
 * }
 */
const isUsbBootCapableUSBDevice = (device) => {
  return !_.isUndefined(_.find(USBBOOT_CAPABLE_USB_DEVICES, {
    vendorID: device.deviceDescriptor.idVendor,
    productID: device.deviceDescriptor.idProduct
  }))
}

/**
 * @summary Create a boot message buffer
 * @function
 * @private
 *
 * @description
 * This is based on the following data structure:
 *
 * typedef struct MESSAGE_S {
 *   int length;
 *   unsigned char signature[20];
 * } boot_message_t;
 *
 * This needs to be sent to the out endpoint of the USB device
 * as a 24 bytes big-endian buffer where:
 *
 * - The first 4 bytes contain the size of the bootcode.bin buffer
 * - The remaining 20 bytes contain the boot signature, which
 *   we don't make use of in this implementation
 *
 * @param {Buffer} bootCodeBufferLength - bootcode.bin buffer length
 * @returns {Buffer} boot message buffer
 *
 * @example
 * const bootMessageBuffer = createBootMessage(50216)
 */
const createBootMessage = (bootCodeBufferLength) => {
  const bootMessageBufferSize = BOOT_MESSAGE_BOOTCODE_LENGTH_SIZE + BOOT_MESSAGE_SIGNATURE_SIZE

  // Buffers are automatically filled with zero bytes
  const bootMessageBuffer = Buffer.alloc(bootMessageBufferSize)

  // The bootcode length should be stored in 4 big-endian bytes
  bootMessageBuffer.writeInt32BE(bootCodeBufferLength, BOOT_MESSAGE_BOOTCODE_LENGTH_OFFSET)

  return bootMessageBuffer
}

/**
 * @summary Scan for usbboot USB capable devices
 * @function
 * @public
 *
 * @fulfil {Object[]} - USB devices
 * @returns {Promise}
 *
 * @example
 * usbboot.scan().each((device) => {
 *   console.log(device)
 * })
 */
exports.scan = () => {
  /* eslint-disable lodash/prefer-lodash-method */
  return usbUtils.listDevices().filter(isUsbBootCapableUSBDevice).map((device) => {
  /* eslint-enable lodash/prefer-lodash-method */

    // We must keep the original device object from `node-usb`,
    // since it has functions in its prototype we must use later on
    const deviceWrapper = {
      instance: device
    }

    // We need to open the device in order to access _configDescriptor
    device.open()

    // Handle 2837 where it can start with two interfaces, the first
    // is mass storage the second is the vendor interface for programming

    /* eslint-disable no-underscore-dangle */
    if (device._configDescriptor.bNumInterfaces === INTERFACES_SOC_BCM2837) {
    /* eslint-enable no-underscore-dangle */
      deviceWrapper.interface = 0
      deviceWrapper.outEndpoint = 1
    } else {
      deviceWrapper.interface = 1
      deviceWrapper.outEndpoint = 3
    }

    return usbUtils.getDeviceName(device).then((name) => {
      deviceWrapper.name = name
      return deviceWrapper
    }).finally(_.bind(device.close, device))
  })
}

const writeEndpoint = (device, endpoint, buffer) => {
  if (buffer.length > USBBOOT_MESSAGE_MAX_BUFFER_LENGTH) {
    return Bluebird.reject(`Can't transfer buffers larger than ${USBBOOT_MESSAGE_MAX_BUFFER_LENGTH}`)
  }

  return usbUtils.performControlTransfer(device.instance, {
    bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR,
    bRequest: USB_REQUEST_CODE_GET_STATUS,
    wValue: buffer.length,
    data: NULL_BUFFER,

    /* eslint-disable no-bitwise */
    wIndex: buffer.length >> 16
    /* eslint-enable no-bitwise */
  }).then(() => {
    return endpoint.transfer(buffer)
  })
}

const readEndpoint = (device, length) => {
  if (length > USBBOOT_MESSAGE_MAX_BUFFER_LENGTH) {
    return Bluebird.reject(`Can't transfer buffers larger than ${USBBOOT_MESSAGE_MAX_BUFFER_LENGTH}`)
  }

  return usbUtils.performControlTransfer(device.instance, {
    /* eslint-disable no-bitwise */
    bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR | usb.LIBUSB_ENDPOINT_IN,
    wIndex: length >> 16,
    /* eslint-enable no-bitwise */

    wValue: length,
    bRequest: USB_REQUEST_CODE_GET_STATUS,
    length
  })
}

const writeBootCode = (device, bootCodeBuffer) => {
  debug(`Bootcode buffer length: ${bootCodeBuffer.length}`)
  const bootMessageBuffer = createBootMessage(bootCodeBuffer.length)

  return usbUtils.findEndpoint(device.instance, device.interface, device.outEndpoint).then((endpoint) => {
    debug('Writing boot message buffer to out endpoint')
    return writeEndpoint(device, endpoint, bootMessageBuffer).delay(USB_OPERATION_DELAY_MS).then(() => {
      debug('Writing boot code buffer to out endpoint')
      return writeEndpoint(device, endpoint, bootCodeBuffer)
    }).delay(USB_OPERATION_DELAY_MS).then(() => {
      debug('Reading return code from endpoint')
      return readEndpoint(device, USBBOOT_RETURN_CODE_LENGTH)
    }).then((data) => {
      const returnCode = data.readInt32BE()
      debug(`Received return code: ${returnCode}`)

      if (returnCode !== 0) {
        throw new Error(`Couldn't write the bootcode, got return code ${returnCode} from device`)
      }
    })
  })
}

const USB_DEVICE_FIND_DELAY_MS = 1000

const waitForDevice = (properties, retries = 5) => {
  return exports.scan().then((devices) => {
    return _.find(devices, (device) => {
      return _.matches(properties, device.instance)
    })
  }).then((device) => {
    if (_.isNil(device) && retries) {
      return Bluebird.delay(USB_DEVICE_FIND_DELAY_MS).then(() => {
        const INTERVAL_DECREASE_FACTOR = 1
        return waitForDevice(properties, retries - INTERVAL_DECREASE_FACTOR)
      })
    }

    return device
  })
}

exports.flash = (device, options = {}) => {
  debug('Opening device')
  device.instance.open()

  return usbUtils.findInterface(device.instance, device.interface).then((deviceInterface) => {
    debug(`Claiming interface: ${device.interface}`)
    deviceInterface.claim()

    const serialNumberIndex = device.instance.deviceDescriptor.iSerialNumber
    debug(`Serial number index: ${serialNumberIndex}`)

    return Bluebird.try(() => {
      if (serialNumberIndex === USB_DESCRIPTOR_NULL_INDEX) {
        debug('Writing bootcode')
        return writeBootCode(device, options.bootcode).delay(USB_OPERATION_DELAY_MS).then(() => {
          debug('Waiting for device to come back')
          return waitForDevice({
            deviceDescriptor: {
              idVendor: USB_VENDOR_ID_BROADCOM_CORPORATION,
              idProduct: 0x2764,
              iSerialNumber: 1
            }
          }).then((device) => {
            if (_.isNil(device)) {
              throw new Error(`Device ${device.deviceDescriptor.idVendor}:${device.deviceDescriptor.idProduct} never came back`)
            }

            return exports.flash(device, options)
          })
        })
      }

      debug('Starting file server')
    }).then(() => {
      return Bluebird
        .fromCallback(_.bind(deviceInterface.release, deviceInterface))
        .finally(_.bind(device.instance.close, device.instance))
    })
  })
}
