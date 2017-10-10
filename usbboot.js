'use strict'

const fs = require('fs')
const path = require('path')
const sdk = require('./lib/shared/sdk/usbboot')
const BLOBS = path.join(__dirname, 'lib', 'blobs', 'usbboot')

const readBlob = (name) => fs.readFileSync(path.join(BLOBS, name))

sdk.scan({
  files: {
    'bootcode.bin': readBlob('bootcode.bin'),
    'config.txt': readBlob('config.txt'),
    'start_cd.elf': readBlob('start_cd.elf'),
    'fixup_cd.dat': readBlob('fixup_cd.dat'),
    'dt-blob.bin': readBlob('dt-blob.bin'),
    'cmdline.txt': readBlob('cmdline.txt'),
    'kernel7.img': readBlob('kernel7.img'),
    'bcm2710-rpi-cm3.dtb': readBlob('bcm2710-rpi-cm3.dtb'),
    'overlays/dwc2.dtbo': readBlob('dwc2.dtbo'),
  }
}).then((drives) => {
  console.log(drives)
})
