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

const middleEllipsis = require('../../utils/middle-ellipsis')

const { Provider, Modal, Txt } = require('rendition')
const { StepButton, StepNameButton, StepSelection,
  DetailsText, ChangeButton } = require('../../styled-components')

const availableDrives = require('./../../models/available-drives')
const { ModalHeader, ModalTitle, CloseButton, ModalBody} = require('./modal-styles')

class DriveSelectorReact extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      availableDrives: 0
    }
  }

  componentDidMount () {
    let checkDrives = availableDrives.getDrives()

    this.timer = setInterval(() => {
      console.log('checking!')
      this.setState({ availableDrives: checkDrives })
    }, 500);
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  render() {
    console.log(this.state.availableDrives.length)
    return(
      <Provider>
        <Modal
          style={{padding: 0}}
          titleElement={
            <React.Fragment>
              <ModalHeader>
                <ModalTitle>'Select a drive'</ModalTitle>
                <CloseButton
                  plaintext
                  onClick={this.props.callback}
                  align='left'
                >
                &times;
                </CloseButton>
              </ModalHeader>
            </React.Fragment>
          }
          primaryButtonProps={{
            margin: '15px',
            warning: true,
            primary: false,
            width: '100%'
  				}}
          action='Continue'
          done={this.props.callback}
        >
            {this.state.availableDrives.length}
        </Modal>
      </Provider>
    )
  }

}

DriveSelectorReact.propTypes = {
  callback: propTypes.func
}

module.exports = DriveSelectorReact
