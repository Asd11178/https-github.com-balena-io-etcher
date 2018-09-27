/*
 * Copyright 2016 resin.io
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

const React = require('react')
const ReactDOM = require('react-dom')
const propTypes = require('prop-types')
const Color = require('color')

const middleEllipsis = require('./../../utils/middle-ellipsis')

const { Provider, Txt } = require('rendition')
const { StepButton, StepNameButton, StepSelection,
  DetailsText, ChangeButton } = require('./../../styled-components')

const DetailsModal = require('./../modal-react/details-modal')
const DriveSelectorReact = require('../modal-react/drive-selector-react')

class DriveSelectorButton extends React.PureComponent {

  constructor(props) {
    super(props)

    this.state = {
      showDetailsModal: false,
      showDriveSelector: false
    }
  }

  allDevicesFooter() {
    if (this.props.howManyDeviceSelected > 1) {
      return this.props.selectedDevices.map((device) =>
        <Txt key={device.device} tooltip={device.description + '(' + device.displayName + ')'}>
          { middleEllipsis(device.description, 14) }
        </Txt>
       )
    }
  }

  selectedDevicesDetails() {
    return this.props.selectedDevices.map((device) =>
      ({
        name: device.description || device.displayName,
        size: shared.bytesToClosestUnit(device.size),
        path: device.device
      })
    )
  }

  render() {
    if (false /*this.props.hasDrive || !this.props.shouldShowDrivesButton*/) {
      return (
        <Provider>
          <StepSelection>
              <StepNameButton
                plaintext
                disabled={this.props.disabled}
                tooltip={this.props.driveListLabel}
                warning={!this.props.howManyDeviceSelected}
                onClick={() => this.setState({ showDetailsModal: true})}
              >
                { middleEllipsis(this.props.drivesTitle, 20) }
                { this.props.hasCompatibilityStatus(this.props.drives(), this.props.image()) ?
                  <Txt.span className='glyphicon glyphicon-alert'
                    ml='10px'
                    tooltip={this.props.getCompatibilityStatuses(this.props.drives(),this.props.image())[0].message}
                  />
                : null
                }
              </StepNameButton>

            <DetailsText>
              {this.props.driveSize}
            </DetailsText>
            { this.props.flashing || !this.props.shouldShowDrivesButton ?
              null
              :
              <ChangeButton
                plaintext
                onClick={this.props.reselectDrive}
              >
                Change
              </ChangeButton>
            }
            <DetailsText>
              {this.allDevicesFooter()}
            </DetailsText>
          </StepSelection>
          {this.state.showDetailsModal ?
            <DetailsModal
              title={'Selected Drivers'}
              details={this.selectedDevicesDetails()}
              callback={() => this.setState({ showDetailsModal: false })}
            />
          : null
          }
        </Provider>
      )
    }
    else {
      return (
        <Provider>
          <StepSelection>
            <StepButton
              primary
              /*disabled={this.props.disabled}*/
              onClick={() => this.setState({ showDriveSelector: true })}
            >
              Select drive react
            </StepButton>
            <Txt color="white" onClick={this.props.openDriveSelector}>Show old selector</Txt>
            {this.state.showDriveSelector ?
              <DriveSelectorReact
                callback={() => this.setState({ showDriveSelector: false })} />
            : null
            }
          </StepSelection>
        </Provider>
      )
    }
  }
}

DriveSelectorButton.propTypes = {
  hasDrive: propTypes.bool,
  shouldShowDrivesButton: propTypes.bool,
  disabled: propTypes.bool,
  drivesTitle: propTypes.string,
  driveListLabel: propTypes.string,
  openDriveSelector: propTypes.func,
  howManyDeviceSelected: propTypes.number,
  reselectDrive: propTypes.func,
  driveSize: propTypes.string,
  hasCompatibilityStatus: propTypes.func,
  getCompatibilityStatuses: propTypes.func,
  drives: propTypes.func,
  image: propTypes.func,
  selectedDevices: propTypes.array,
  openDriveSelector: propTypes.func
}

module.exports = DriveSelectorButton
