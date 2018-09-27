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

const { Provider, Modal, Txt, Heading, Box, Flex } = require('rendition')
const {
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalBody,
} = require('./modal-styles')

const styled = require('styled-components').default

const availableDrives = require('./../../models/available-drives')
const { colors } = require('./../../theme')
const shared = require('/./../../../../../lib/shared/units')

const DeviceListElem = styled(Box) `
  font-size: 12px;
  padding: 11px 0;
  border-bottom: 1.5px solid ${colors.light.soft.background};
  width: 100%;
`

const DeviceList = styled(Box)`
  margin: -50px 15px -35px 15px;
`

const Tick = styled(Txt.span) `
  font-size: 21px;
  color: ${colors.dark.soft.foreground};

  &:[disabled] {
    color: ${colors.dark.soft.foreground};
    background-color: transparent;
  }

  &:[success=true] {
    color: ${colors.success.foreground};
    background-color: ${colors.success.background};
  }

  &:[error=true] {
    color: ${colors.danger.foreground};
    background-color: ${colors.danger.background};
  }

`

class DriveSelectorReact extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      availableDrives: availableDrives.getDrives()
    }
  }

  componentDidMount () {
    this.timer = setInterval(() => {
      let checkDrives = availableDrives.getDrives()
      if (this.state.availableDrives !== checkDrives){    //TODO: if doesn't work
        console.log('different')//this.setState({ availableDrives: checkDrives })
      }
      else {
        console.log('same')
      }
    }, 500);
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  renderDrivesList() {
    return this.state.availableDrives.map((drive) =>
        <Provider key={drive.device}>
          <DeviceListElem>
            <Flex flexDirection='row'
              justify='space-between'
              style={{ alignItems: 'center'}}
            >
              <Flex flexDirection='column'>
                <Heading.h6
                  color='#666'
                  align='left'
                >
                  {drive.description}{' '}-{' '}{shared.bytesToClosestUnit(drive.size)}
                </Heading.h6>
                <Txt
                  color='#b3b3b3'
                  size='11px'
                  align='left'
                  style={{padding: 0}}
                >
                  {drive.device}
                </Txt>
              </Flex>
              <Tick className="glyphicon glyphicon-ok-circle" />
            </Flex>
          </DeviceListElem>
        </Provider>
      )
    }

  render() {
    console.log(this.state.availableDrives)
    return(
      <Provider>
        <Modal
          width='315px'
          height='320px'
          style={{padding: '0 10px 15px 15px'}}
          titleElement={
            <React.Fragment>
              <ModalHeader>
                <ModalTitle>'Select a drive'</ModalTitle>
                <CloseButton
                  plaintext
                  onClick={this.props.callback}
                  align='left'
                  mr='15px'
                >
                &times;
                </CloseButton>
              </ModalHeader>
            </React.Fragment>
          }
          primaryButtonProps={{
            width: '100%',
            disabled: true,

          }}
          action='Continue'
          done={this.props.callback}
        >
          <DeviceList>
            {this.renderDrivesList()}
          </DeviceList>
        </Modal>
      </Provider>
    )
  }

}

DriveSelectorReact.propTypes = {
  callback: propTypes.func
}

module.exports = DriveSelectorReact
