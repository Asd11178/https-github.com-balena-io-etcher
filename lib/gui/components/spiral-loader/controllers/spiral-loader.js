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
  DrivesModel,
  SelectionStateModel,
  DriveConstraintsModel) {

  /**
   * @summary The drive selector state
   * @property
   * @type Object
   */
  this.state = SelectionStateModel;

  /**
   * @summary Static methods to check a drive's properties
   * @property
   * @type Object
   */
  this.constraints = DriveConstraintsModel;

  /**
   * @summary The drives model
   * @property
   * @type Object
   *
   * @description
   * We expose the whole service instead of the `.drives`
   * property, which is the one we're interested in since
   * this allows the property to be automatically updated
   * when `DrivesModel` detects a change in the drives.
   */
  this.drives = DrivesModel;

};
