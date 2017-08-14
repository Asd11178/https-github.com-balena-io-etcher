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

'use strict'

const _ = require('lodash')
const usb = require('usb')
const Bluebird = require('bluebird')

/**
 * @summary Get a USB device string from an index
 * @function
 * @public
 *
 * @param {Object} device - device
 * @param {Number} index - string index
 * @fulfil {String} - string
 * @returns {Promise}
 *
 * @example
 * usbUtils.getDeviceStringFromIndex({ ... }, 5).then((string) => {
 *   console.log(string)
 * })
 */
exports.getDeviceStringFromIndex = (device, index) => {
  return Bluebird.fromCallback((callback) => {
    device.getStringDescriptor(index, callback)
  })
}

/**
 * @summary List the available USB devices
 * @function
 * @public
 *
 * @fulfil {Object[]} - usb devices
 * @returns {Promise}
 *
 * @example
 * usbUtils.listDevices().each((device) => {
 *   console.log(device)
 * })
 */
exports.listDevices = () => {
  return Bluebird.resolve(usb.getDeviceList())
}

/**
 * @summary Perform a USB control transfer
 * @function
 * @public
 *
 * @description
 * See http://libusb.sourceforge.net/api-1.0/group__syncio.html
 *
 * @param {Object} device - usb device
 * @param {Object} options - options
 * @param {Number} options.bmRequestType - the request type field for the setup packet
 * @param {Number} options.bRequest - the request field for the setup packet
 * @param {Number} options.wValue - the value field for the setup packet
 * @param {Number} options.wIndex - the index field for the setup packet
 * @param {Buffer} [options.data] - output data buffer (for OUT transfers)
 * @param {Number} [options.length] - input data size (for IN transfers)
 * @fulfil {(Buffer|Undefined)} - result
 * @returns {Promise}
 *
 * @example
 * const usb = require('usb')
 * const buffer = Buffer.alloc(512)
 *
 * usbUtils.performControlTransfer({ ... }, {
 *   bmRequestType: usb.LIBUSB_REQUEST_TYPE_VENDOR
 *   bRequest: 0,
 *   wValue: buffer.length & 0xffff,
 *   wIndex: buffer.length >> 16,
 *   data: Buffer.alloc(256)
 * })
 */
exports.performControlTransfer = (device, options) => {
  if (_.isNil(options.data) && _.isNil(options.length)) {
    return Bluebird.reject(new Error('You must define either data or length'))
  }

  if (!_.isNil(options.data) && !_.isNil(options.length)) {
    return Bluebird.reject(new Error('You can define either data or length, but not both'))
  }

  return Bluebird.fromCallback((callback) => {
    device.controlTransfer(
      options.bmRequestType,
      options.bRequest,
      options.wValue,
      options.wIndex,
      options.data || options.length,
      callback
    )
  })
}

/**
 * @summary Find a USB interface by its number
 * @function
 * @public
 *
 * @param {Object} device - usb device
 * @param {Number} interfaceNumber - interface number
 * @fulfil {Object} - interface
 * @returns {Promise}
 *
 * @example
 * usbUtils.findInterface({ ... }, 2).then((interface) => {
 *   interface.claim()
 * })
 */
exports.findInterface = (device, interfaceNumber) => {
  const deviceInterface = device.interfaces[interfaceNumber]

  if (_.isNil(deviceInterface)) {
    return Bluebird.reject(new Error(`USB interface not found: ${interfaceNumber}`))
  }

  return Bluebird.resolve(deviceInterface)
}

/**
 * @summary Find a USB endpoint by its address
 * @function
 * @public
 *
 * @param {Object} device - usb device
 * @param {Number} interfaceNumber - interface number
 * @param {Number} endpointAddress - endpoint address
 * @fulfil {Object} - endpoint
 * @returns {Promise}
 *
 * @example
 * usbUtils.findEndpoint({ ... }, 2, 130).then((endpoint) => {
 *   endpoint.transfer(Buffer.alloc(256))
 * })
 */
exports.findEndpoint = (device, interfaceNumber, endpointAddress) => {
  return exports.findInterface(device, interfaceNumber).then((deviceInterface) => {
    const endpoint = _.find(deviceInterface.endpoints, {
      address: endpointAddress
    })

    if (_.isNil(endpoint)) {
      throw new Error(`USB endpoint not found: ${device.outEndpoint}`)
    }

    return endpoint
  })
}

/**
 * @summary Get a human friendly name for a USB device
 * @function
 * @public
 *
 * @description
 * This function assumes the device is open.
 *
 * @param {Object} device - usb device
 * @fulfil {String} - device name
 * @returns {Promise}
 *
 * @example
 * usbUtils.getDeviceName({ ... }).then((name) => {
 *   console.log(name)
 * })
 */
exports.getDeviceName = (device) => {
  return Bluebird.props({
    manufacturer: exports.getDeviceStringFromIndex(device, device.deviceDescriptor.iManufacturer),
    product: exports.getDeviceStringFromIndex(device, device.deviceDescriptor.iProduct)
  }).tap((properties) => {
    return `${properties.manufacturer} ${properties.product}`
  })
}
