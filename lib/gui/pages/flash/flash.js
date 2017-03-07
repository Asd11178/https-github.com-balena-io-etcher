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
 * @module Etcher.Pages.Flash
 *
 * What?
 *
 * Purpose?
 */

const angular = require('angular');
const MODULE_NAME = 'Etcher.Pages.Flash';
const FlashPage = angular.module(MODULE_NAME, [
  require('angular-ui-router'),
  require('../../models/selection-state'),
  require('../../components/spiral-loader/spiral-loader'),
]);

FlashPage.controller('FlashPageController', require('./controllers/flash'));

FlashPage.config(($stateProvider) => {
  $stateProvider
    .state('flash', {
      url: '/flash',
      controller: 'FlashPageController as flash',
      templateUrl: './pages/flash/templates/flash.tpl.html'
    });
});

module.exports = MODULE_NAME;
