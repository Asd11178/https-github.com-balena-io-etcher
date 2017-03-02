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

/**
 * @summary SpiralLoader directive
 * @function
 * @public
 *
 * @description
 * Spiral loader
 *
 * @returns {Object}
 *
 * @example
 * <spiral-loader></spiral-loader>
 */
module.exports = ($timeout, SpiralLoaderService) => {
  return {
    templateUrl: './components/spiral-loader/templates/spiral-loader.tpl.html',
    replace: true,
    restrict: 'E',
    scope: {
      title: '@',
      subtitle: '@',
    },
    link: (scope, element) => {
      // The 'svg-icon' directive isn't handled and elements unavailable unless
      // we do this.
      $timeout(() => {
        const spiral = element[0].children[0];
        const dots = spiral.getElementsByTagName('path');
        SpiralLoaderService.dots = dots;

        for (let i = 0; i < dots.length; i++) {
          const red = Math.min(1, i / 256) * 256 - 1;
          const blue = i > 0x100 ? 0x100 - i % 256 : 0xFF;
          const green = 0;
          const hex = (blue + (green << 8) + (red << 16)).toString(16);
          //const color = '0'.repeat(6 - hex.length % 6) + hex;
          const color = hex;

          console.log(`red = ${red}, green = ${green}, blue = ${blue} == ${color}`);

          SpiralLoaderService.setDotColor(i, '#' + color);

          const [x, y] = dots[i].getAttribute('d').split(' ')[0].substr(1).split(',');
          const textWrap = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          textWrap.setAttributeNS(null, 'x', x);
          textWrap.setAttributeNS(null, 'y', y);
          textWrap.setAttributeNS(null, 'font-size', '10');
          textWrap.style.fill = 'black';
          const label = document.createTextNode(i);
          textWrap.appendChild(label);
          spiral.children[0].getElementById('Group').appendChild(textWrap);
        }
      });
    }
  };
};
