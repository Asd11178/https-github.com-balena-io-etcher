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

/**
 * @module Etcher.Components.SpiralLoader
 */

const angular = require('angular');
const MODULE_NAME = 'Etcher.Components.SpiralLoader';
const SpiralLoader = angular.module(MODULE_NAME, [
  require('../../models/drives'),
  require('../../models/selection-state'),
  require('../../models/drive-constraints'),
  require('../../utils/byte-size/byte-size'),
  require('../../components/svg-icon/svg-icon'),
]);

SpiralLoader.controller('SpiralLoaderController', require('./controllers/spiral-loader'));
SpiralLoader.service('SpiralLoaderService', require('./services/spiral-loader'));
SpiralLoader.directive('spiralLoader', require('./directives/spiral-loader'));

module.exports = MODULE_NAME;
