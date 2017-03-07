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

'use strict';

const _ = require('lodash');

module.exports = function(
  $q,
  $state,
  AnalyticsService,
  DriveScannerService,
  DrivesModel,
  ErrorService,
  FlashErrorModalService,
  FlashStateModel,
  ImageWriterService,
  OSNotificationService,
  OSWindowProgressService,
  SelectionStateModel,
  SpiralLoaderService) {

  /*
   *
   */
  this.getDrives = DrivesModel.getDrives;

  /*
   *
   */
  this.selectDrive = (drive) => SelectionStateModel.setDrive(drive.device);

  this.selection = SelectionStateModel;

  /**
   * @summary Flash image to a drive
   * @function
   * @public
   *
   * @param {String} image - image path
   * @param {Object} drive - drive
   *
   * @example
   * FlashController.flashImageToDrive('rpi.img', {
   *   device: '/dev/disk2',
   *   description: 'Foo',
   *   size: 99999,
   *   mountpoint: '/mnt/foo',
   *   system: false
   * });
   */
  this.flashImageToDrive = (image, drive) => {
    if (FlashStateModel.isFlashing()) {
      return;
    }

    // Stop scanning drives when flashing
    // otherwise Windows throws EPERM
    DriveScannerService.stop();

    AnalyticsService.logEvent('Flash', {
      image: image,
      device: drive.device
    });

    ImageWriterService.flash(image, drive).then(() => {
      if (FlashStateModel.wasLastFlashCancelled()) {
        return; }

      OSNotificationService.send('Success!', messages.info.flashComplete());
      AnalyticsService.logEvent('Done');
      $state.go('success');
    })
    .catch((error) => {
      OSNotificationService.send('Oops!', messages.error.flashFailure());

      if (error.code === 'EVALIDATION') {
        FlashErrorModalService.show(messages.error.validation());
        AnalyticsService.logEvent('Validation error');
      } else if (error.code === 'ENOSPC') {
        FlashErrorModalService.show(messages.error.notEnoughSpaceInDrive());
        AnalyticsService.logEvent('Out of space');
      } else {
        FlashErrorModalService.show(messages.error.genericFlashError());
        ErrorService.reportException(error);
        AnalyticsService.logEvent('Flash error');
      }

    })
    .finally(() => {
      OSWindowProgressService.clear();
      DriveScannerService.start();
    });
  };

  /**
   * @summary Animate the flash progress spiral
   * @function
   * @public
   *
   * @example
   * FlashController.animateFlashSpiral();
   */
  this.animateFlashSpiral = () => {
    const element = SpiralLoaderService.element;
    const spiralElement = _.get(element, [0, 'children', 0]);
    const dots = spiralElement.getElementsByTagName('path');
    SpiralLoaderService.dots = dots;

    // Specific colors
    const FAINT_ORANGE = 0xfde6d2;
    const MEDIUM_ORANGE = 0xf9c08f;
    const STRONG_ORANGE = 0xf4811f;
    const UNUSED_GRAY = 0x8d7f80;

    const FAINT_ORANGE_COLOR = '#' + FAINT_ORANGE.toString(16);
    const MEDIUM_ORANGE_COLOR = '#' + MEDIUM_ORANGE.toString(16);
    const STRONG_ORANGE_COLOR = '#' + STRONG_ORANGE.toString(16);
    const BLUE_COLOR = 'blue';
    const UNUSED_GRAY_COLOR = '#' + UNUSED_GRAY.toString(16);

    // FIXME 101%? u wot
    // FIXME 100% but one missing dot? excuse me sir

    const IMAGE_SIZE = SelectionStateModel.getImageSize();
    const DRIVE_SIZE = _.get(SelectionStateModel.getDrive(), 'size');

    const DOTS_VOLUME = Math.round(IMAGE_SIZE / DRIVE_SIZE * dots.length);

    console.log(`image (${IMAGE_SIZE}) / drive (${DRIVE_SIZE}) = ${IMAGE_SIZE / DRIVE_SIZE}, DOTS_VOLUME = ${DOTS_VOLUME}`);

    for (let i = 0; i < dots.length; i++) {

      if (i < DOTS_VOLUME) {
        SpiralLoaderService.setDotColor(i, MEDIUM_ORANGE_COLOR);

      } else {
        SpiralLoaderService.setDotColor(i, FAINT_ORANGE_COLOR);
      }
    }

    const percentLabel = document.createTextNode('0%');
    const flashingLabel = document.createTextNode('Flashing');

    const percentWrap = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    percentWrap.setAttributeNS(null, 'x', 230);
    percentWrap.setAttributeNS(null, 'y', 240);
    percentWrap.setAttributeNS(null, 'font-size', '42');
    percentWrap.setAttributeNS(null, 'text-anchor', 'middle');
    percentWrap.style.fill = STRONG_ORANGE_COLOR;
    percentWrap.appendChild(percentLabel);
    spiralElement.children[0].getElementById('Group').appendChild(percentWrap);
    const flashingWrap = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    flashingWrap.setAttributeNS(null, 'x', 230);
    flashingWrap.setAttributeNS(null, 'y', 260);
    flashingWrap.setAttributeNS(null, 'font-size', '16');
    flashingWrap.setAttributeNS(null, 'text-anchor', 'middle');
    flashingWrap.style.fill = STRONG_ORANGE_COLOR;
    flashingWrap.appendChild(flashingLabel);
    spiralElement.children[0].getElementById('Group').appendChild(flashingWrap);

    let dotIndex = 0;

    // TODO add blue dots on verifying; use FlashStateModel.type and reuse .percentage
    const addDotColor = (timestamp) => {

      // Exit early; we're not flashing anymore.
      if (!FlashStateModel.isFlashing()) return;

      // TODO actually use flashSpeed
      const flashSpeed = FlashStateModel.getFlashState().speed;
      const flashPercentage = FlashStateModel.getFlashState().percentage;
      const flashProgressDots = Math.floor(DOTS_VOLUME / 100 * flashPercentage);

      // XXX can we remove use of dotIndex? We know how many dots to color on
      //     each 'step', so yes? Then it will color blue verification dots.
      if (dotIndex < flashProgressDots) {
        while (dotIndex < flashProgressDots) {
          dotIndex++;
          const COLOR =
            FlashStateModel.type === 'write' ? STRONG_ORANGE_COLOR : BLUE_COLOR;

          SpiralLoaderService.setDotColor(dotIndex, COLOR);
          console.log(`dotIndex = ${dotIndex} / ${flashProgressDots}, ${DOTS_VOLUME}`);
        }

        percentLabel.textContent = `${flashPercentage}%`;
      }

      console.log(`percentage = ${flashPercentage}, speed = ${flashSpeed}`);

      if (dotIndex < DOTS_VOLUME) {
        requestAnimationFrame(addDotColor);
      }
    };

    requestAnimationFrame(addDotColor);
  };
};
