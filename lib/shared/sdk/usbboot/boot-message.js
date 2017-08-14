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
 * const bootMessageBuffer = bootMessage.create(50216)
 */
exports.create = (bootCodeBufferLength) => {
  const bootMessageBufferSize = BOOT_MESSAGE_BOOTCODE_LENGTH_SIZE + BOOT_MESSAGE_SIGNATURE_SIZE

  // Buffers are automatically filled with zero bytes
  const bootMessageBuffer = Buffer.alloc(bootMessageBufferSize)

  // The bootcode length should be stored in 4 big-endian bytes
  bootMessageBuffer.writeInt32BE(bootCodeBufferLength, BOOT_MESSAGE_BOOTCODE_LENGTH_OFFSET)

  return bootMessageBuffer
}
