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
 * @summary Get a USB device string from an index
 * @function
 * @private
 *
 * @param {Object} device - device
 * @param {Number} index - string index
 * @fulfil {String} - string
 * @returns {Promise}
 *
 * @example
 * getDeviceStringFromIndex({ ... }, 5).then((string) => {
 *   console.log(string)
 * })
 */
const getDeviceStringFromIndex = (device, index) => {
  return Bluebird.fromCallback((callback) => {
    device.getStringDescriptor(index, callback)
  })
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
  return Bluebird.resolve(usb.getDeviceList()).filter(isUsbBootCapableUSBDevice).map((device) => {
  /* eslint-enable lodash/prefer-lodash-method */

    // We must keep the original device object from `node-usb`,
    // since it has functions in its prototype we must use later on
    const userFriendlyDeviceObject = {
      device
    }

    // We need to open the device in order to access _configDescriptor
    device.open()

    // Handle 2837 where it can start with two interfaces, the first
    // is mass storage the second is the vendor interface for programming

    /* eslint-disable no-underscore-dangle */
    if (device._configDescriptor.bNumInterfaces === INTERFACES_SOC_BCM2837) {
    /* eslint-enable no-underscore-dangle */
      userFriendlyDeviceObject.interface = 0
      userFriendlyDeviceObject.outEndpoint = 1
    } else {
      userFriendlyDeviceObject.interface = 1
      userFriendlyDeviceObject.outEndpoint = 3
    }

    return Bluebird.props({
      manufacturer: getDeviceStringFromIndex(device, device.deviceDescriptor.iManufacturer),
      product: getDeviceStringFromIndex(device, device.deviceDescriptor.iProduct)
    }).tap((properties) => {
      userFriendlyDeviceObject.name = `${properties.manufacturer} ${properties.product}`
    }).return(userFriendlyDeviceObject).finally(device.close.bind(device))
  })
}
