/*
 * Copyright 2016 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use exports file except in compliance with the License.
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
const store = require('./../../models/store')
const prettyBytes = require('pretty-bytes')
const settings = require('./../../models/settings')
const utils = require('./../../../../shared/utils')
const constraints = require('./../../../../shared/drive-constraints')

/**
 * @summary Get drive title based on device quantity
 * @function
 * @public
 *
 * @returns {String} - drives title
 *
 * @example
 * console.log(DriveSelectionController.getDrivesTitle())
 * > 'Multiple Drives (4)'
 */
exports.getDrivesTitle = () => {
  const drives = exports.getSelectedDrives()

  // eslint-disable-next-line no-magic-numbers
  if (drives.length === 1) {
    return _.head(drives).description || 'Untitled Device'
  }

  // eslint-disable-next-line no-magic-numbers
  if (drives.length === 0) {
    return 'No targets found'
  }

  return drives.length + ' Devices'
}

/**
 * @summary Get all selected drives' devices
 * @function
 * @public
 *
 * @returns {String[]} selected drives' devices
 *
 * @example
 * for (driveDevice of selectionState.getSelectedDevices()) {
 *   console.log(driveDevice)
 * }
 * > '/dev/disk1'
 * > '/dev/disk2'
 */
exports.getSelectedDevices = () => {
  return store.getState().getIn([ 'selection', 'devices' ]).toJS()
}

/**
 * @summary Check if there is a selected drive
 * @function
 * @public
 *
 * @returns {Boolean} whether there is a selected drive
 *
 * @example
 * if (selectionState.hasDrive()) {
 *   console.log('There is a drive!');
 * }
 */
exports.hasDrive = () => {
  return Boolean(exports.getSelectedDevices().length)
}

/**
 * @summary Get drive list label
 * @function
 * @public
 *
 * @returns {String} - 'list' of drives separated by newlines
 *
 * @example
 * console.log(DriveSelectionController.getDriveListLabel())
 * > 'My Drive (/dev/disk1)\nMy Other Drive (/dev/disk2)'
 */
exports.getDriveListLabel = () => {
  return _.join(_.map(exports.getSelectedDrives(), (drive) => {
    return drive.description + '(' + drive.displayName + ')'
  }), '\n')
}

/**
 * @summary Get drive subtitle
 * @function
 * @public
 *
 * @returns {String} - drives subtitle
 *
 * @example
 * console.log(DriveSelectionController.getDrivesSubtitle())
 * > '32 GB'
 */
exports.getDrivesSubtitle = () => {
  const drive = exports.getCurrentDrive()

  if (drive) {
    return prettyBytes(drive.size)
  }

  return 'Please insert at least one target device'
}

/**
 * @summary Get detected drives
 * @function
 * @private
 *
 * @returns {Object[]} drives
 *
 * @example
 * const drives = availableDrives.getAvailableDrives();
 */
exports.getAvailableDrives = () => {
  return store.getState().toJS().availableDrives
}

/**
 * @summary Check if there are available drives
 * @function
 * @public
 *
 * @returns {Boolean} whether there are available drives
 *
 * @example
 * if (availableDrives.hasAvailableDrives()) {
 *   console.log('There are available drives!');
 * }
 */
exports.hasAvailableDrives = () => {
  return !_.isEmpty(exports.getAvailableDrives())
}

/**
 * @summary Deselect all drives
 * @function
 * @public
 *
 * @example
 * selectionState.deselectAllDrives()
 */
exports.deselectAllDrives = () => {
  _.each(exports.getSelectedDevices(), exports.deselectDrive)
}

/**
 * @summary Toggle drive selection
 * @function
 * @public
 *
 * @param {String} driveDevice - drive device
 *
 * @example
 * selectionState.toggleDrive('/dev/disk2');
 */
exports.toggleDrive = (driveDevice) => {
  if (exports.isDriveSelected(driveDevice)) {
    exports.deselectDrive(driveDevice)
  } else {
    exports.selectDrive(driveDevice)
  }
}

/**
 * @summary Select a drive by its device path
 * @function
 * @public
 *
 * @param {String} driveDevice - drive device
 *
 * @example
 * selectionState.selectDrive('/dev/disk2');
 */
exports.selectDrive = (driveDevice) => {
  console.log('select drive:', driveDevice)
  store.dispatch({
    type: store.Actions.SELECT_DRIVE,
    data: driveDevice
  })
}

/**
 * @summary Remove drive from selection
 * @function
 * @public
 *
 * @param {String} driveDevice - drive device identifier
 *
 * @example
 * selectionState.deselectDrive('/dev/sdc');
 *
 * @example
 * selectionState.deselectDrive('\\\\.\\PHYSICALDRIVE3');
 */
exports.deselectDrive = (driveDevice) => {
  store.dispatch({
    type: store.Actions.DESELECT_DRIVE,
    data: driveDevice
  })
}

/**
 * @summary Check whether a given device is selected.
 * @function
 * @public
 *
 * @param {String} driveDevice - drive device identifier
 * @returns {Boolean}
 *
 * @example
 * const isSelected = selectionState.isDriveSelected('/dev/sdb')
 *
 * if (isSelected) {
 *   selectionState.deselectDrive(driveDevice)
 * }
 */
exports.isDriveSelected = (driveDevice) => {
  if (!driveDevice) {
    return false
  }

  const selectedDriveDevices = exports.getSelectedDevices()
  return _.includes(selectedDriveDevices, driveDevice)
}

/**
 * @summary Get all selected drives' devices
 * @function
 * @public
 *
 * @returns {String[]} selected drives' devices
 *
 * @example
 * for (driveDevice of selectionState.getSelectedDevices()) {
 *   console.log(driveDevice)
 * }
 * > '/dev/disk1'
 * > '/dev/disk2'
 */
exports.getSelectedDevices = () => {
  return store.getState().getIn([ 'selection', 'devices' ]).toJS()
}

/**
 * @summary Get all selected drive objects
 * @function
 * @public
 *
 * @returns {Object[]} selected drive objects
 *
 * @example
 * for (drive of selectionState.getSelectedDrives()) {
 *   console.log(drive)
 * }
 * > '{ device: '/dev/disk1', size: 123456789, ... }'
 * > '{ device: '/dev/disk2', size: 987654321, ... }'
 */
exports.getSelectedDrives = () => {
  const drives = exports.getAvailableDrives()
  return _.map(exports.getSelectedDevices(), (device) => {
    return _.find(drives, { device })
  })
}

/**
 * @summary Get the head of the list of selected drives
 * @function
 * @public
 *
 * @returns {Object} drive
 *
 * @example
 * const drive = selectionState.getCurrentDrive();
 * console.log(drive)
 * > { device: '/dev/disk1', name: 'Flash drive', ... }
 */
exports.getCurrentDrive = () => {
  const device = _.head(exports.getSelectedDevices())
  return _.find(exports.getAvailableDrives(), { device })
}

/**
 * @summary Get a drive's compatibility status object(s)
 * @function
 * @public
 *
 * @description
 * Given a drive, return its compatibility status with the selected image,
 * containing the status type (ERROR, WARNING), and accompanying
 * status message.
 *
 * @returns {Object[]} list of objects containing statuses
 *
 * @example
 * const statuses = DriveSelectorController.getDriveStatuses(drive);
 *
 * for ({ type, message } of statuses) {
 *   // do something
 * }
 */
exports.getDriveStatuses = utils.memoize((drive, image) => {
  return constraints.getDriveImageCompatibilityStatuses(drive, image)
}, _.isEqual)

/**
 * @summary Select drives by theirs device path
 * @function
 * @public
 *
 * @param {Array} driveDevices - all drive devices to select
 *
 * @example
 * selectionState.selectDrives(['/dev/disk1','/dev/disk2']);
 */

exports.selectDevices = (devices) => {
  console.log('select devices: ', devices)
  return devices.map((device) => exports.selectDrive(device))
}
