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

const m = require('mochainon')
const _ = require('lodash')
const usb = require('usb')
const usbboot = require('../../../lib/shared/sdk/usbboot')

const createUSBDeviceStub = (options) => {
  return {
    deviceDescriptor: {
      idVendor: options.vendorID,
      idProduct: options.productID,
      iManufacturer: options.manufacturerIndex,
      iProduct: options.productIndex
    },
    _configDescriptor: {
      bNumInterfaces: options.interfaces
    },
    open: _.noop,
    close: _.noop,
    getStringDescriptor: (index, callback) => {
      callback(null, options.strings[index])
    }
  }
}

const RASPBERRY_PI_ZERO_STUB = createUSBDeviceStub({
  vendorID: 2652,
  productID: 10083,
  manufacturerIndex: 1,
  productIndex: 2,
  interfaces: 1,
  strings: [
    null,
    'Broadcom',
    'BCM2708 Boot'
  ]
})

describe('SDK: usbboot', function () {
  describe('.scan()', function () {
    describe('given no available USB devices', function () {
      beforeEach(function () {
        this.usbGetDeviceListStub = m.sinon.stub(usb, 'getDeviceList')
        this.usbGetDeviceListStub.returns([])
      })

      afterEach(function () {
        this.usbGetDeviceListStub.restore()
      })

      it('should resolve an empty array', function () {
        return usbboot.scan().then((devices) => {
          m.chai.expect(devices).to.deep.equal([])
        })
      })
    })

    describe('given a non supported device', function () {
      beforeEach(function () {
        this.usbGetDeviceListStub = m.sinon.stub(usb, 'getDeviceList')
        this.usbGetDeviceListStub.returns([
          createUSBDeviceStub({
            vendorID: 0x9999,
            productID: 0x2763,
            manufacturerIndex: 1,
            productIndex: 2,
            interfaces: 2,
            strings: [
              null,
              'FOO',
              'X2763'
            ]
          })
        ])
      })

      afterEach(function () {
        this.usbGetDeviceListStub.restore()
      })

      it('should resolve an empty array', function () {
        return usbboot.scan().then((devices) => {
          m.chai.expect(devices).to.deep.equal([])
        })
      })
    })

    describe('given a supported and a non supported device', function () {
      beforeEach(function () {
        this.usbGetDeviceListStub = m.sinon.stub(usb, 'getDeviceList')
        this.usbGetDeviceListStub.returns([
          RASPBERRY_PI_ZERO_STUB,
          createUSBDeviceStub({
            vendorID: 9999,
            productID: 9999,
            manufacturerIndex: 1,
            productIndex: 2,
            interfaces: 1,
            strings: [
              null,
              'Foo',
              'Bar'
            ]
          })
        ])
      })

      afterEach(function () {
        this.usbGetDeviceListStub.restore()
      })

      it('should only resolve the supported device', function () {
        return usbboot.scan().then((devices) => {
          m.chai.expect(devices.length).to.equal(1)
          const device = _.first(devices)
          m.chai.expect(device.name).to.equal('Broadcom BCM2708 Boot')
        })
      })
    })

    describe('given a Raspberry Pi Zero', function () {
      beforeEach(function () {
        this.usbGetDeviceListStub = m.sinon.stub(usb, 'getDeviceList')
        this.usbGetDeviceListStub.returns([ RASPBERRY_PI_ZERO_STUB ])
      })

      afterEach(function () {
        this.usbGetDeviceListStub.restore()
      })

      it('should resolve a friendly device object', function () {
        return usbboot.scan().then((devices) => {
          m.chai.expect(devices.length).to.equal(1)
          const device = _.first(devices)
          m.chai.expect(device.name).to.equal('Broadcom BCM2708 Boot')
          m.chai.expect(device.interface).to.equal(0)
          m.chai.expect(device.outEndpoint).to.equal(1)
          m.chai.expect(device.device).to.deep.equal(RASPBERRY_PI_ZERO_STUB)
        })
      })
    })
  })
})
