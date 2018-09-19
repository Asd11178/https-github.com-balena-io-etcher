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

import styled, { ThemeProvider } from 'styled-components'
import { Button, Txt, Box, Provider } from 'rendition'

import shared from '/./../../../../../lib/shared/units.js'
import consts from './../../scss/main'
import theme from './../../scss/modules/_theme'

const StyledButton = styled(Button)`
  width: 100%;
  max-width: ${theme.colors.$btnMinWidth};
  margin: auto;

  &:disabled {
    background-color: ${theme.colors.$paletteThemeDarkDisabledBackground};
    color: ${theme.colors.$paletteThemeDarkDisabledForeground};
    &:hover {
      background-color: ${theme.colors.$paletteThemeDarkDisabledBackground};
      color: ${theme.colors.$paletteThemeDarkDisabledForeground};
    }
  }

  overflow: hidden;
`

const DriveNameButton = styled(Button).attrs({
  className: 'step-image step-name'
})`
  &:hover {
    color: ${theme.colors.$paletteThemePrimaryForeground};
  }

  &:focus {
    color: ${theme.colors.$paletteThemePrimaryForeground};
  }

  &:active {
    color: ${theme.colors.$paletteThemePrimaryForeground};
  }
`

const ChangeButton = styled(Button).attrs({
  className: 'button button-link step-footer'
})``

const StyledText = styled(Txt).attrs({
  className: 'step-image step-size'
})``

const DriveSelectorButton = props => {

  render () {
    if (!props.hasDrive() && props.shouldShowDrivesButton()){
      return (
        <Provider>
          <StyledButton
            primary
            disabled={this.props.disabled()}
            // onClick={() => this.props.openImageSelector()}
          >
            SELECT DRIVE REACT
          </StyledButton>
        </Provider>
      )
    }
    else {
      return (
        <Provider>
          <DriveNameButton
            plaintext
            // onClick={() => this.props.showSelectedImageDetails()}
            // tooltip={this.props.getImageBasename}
          >
            //{ this.state.chosenImage}
          </DriveNameButton>
          <StyledText>
            //{ this.state.imageSize}
          </StyledText>
          { this.props.flashing ?
            null
            :
            <ChangeButton
              plaintext
              // onClick={() => this.props.reselectImage()}
            >
              Change
            </ChangeButton>
          }
        </Provider>
      )
    }
  }
}

module.exports = DriveSelectorButton
