'use strict'

const fs = require('fs')
const path = require('path')
const sdk = require('./lib/shared/sdk/usbboot')
const BLOBS = path.join(__dirname, 'lib', 'blobs', 'usbboot')

const readBlob = (name) => fs.readFileSync(path.join(BLOBS, name))

sdk.scan({
  files: {
    'bootcode.bin': readBlob('bootcode.bin'),
    'start.elf': readBlob('start.elf')
  }
}).then((drives) => {
  console.log(drives)
})
