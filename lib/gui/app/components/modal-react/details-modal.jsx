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
const { Provider, Modal, Txt } = require('rendition')

const { ModalHeader, ModalTitle, CloseButton, ModalBody} = require('./modal-styles')

class DetailsModal extends React.Component {

  renderDetails() {
    let lines = []
    this.props.details.forEach(function(line){
      lines.push(
        <Txt key={line}>
          { line }
        </Txt>
      )
    })
    return lines
  }

  render() {
    return (
      <Provider>
        <Modal
          style={{padding: 0}}
          titleElement={
            <React.Fragment>
              <ModalHeader>
                <ModalTitle>{this.props.title}</ModalTitle>
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
  						position: 'absolute',
              top: 0,
              right: 0,
              plaintext: true,
              primary: false
  				}}
          action=' '
          done={this.props.callback}
        >
            <ModalBody>
              {this.renderDetails()}
            </ModalBody>
        </Modal>
      </Provider>
    )
  }
}

DetailsModal.propTypes = {
  title: propTypes.string,
  details: propTypes.array,
  callback: propTypes.func
}

module.exports = DetailsModal
