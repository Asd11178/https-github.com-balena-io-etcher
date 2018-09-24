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

const styled = require('styled-components').default
const { Provider, Button, Modal, Flex, Txt, Box } = require('rendition')

'use strict'

const { colors } = require('./../../theme')

exports.ModalHeader = styled(Flex)`
  text-align: left;
  align-items: baseline;
  font-size: 12px;
  color: ${colors.light.soft.foreground};
  padding: 11px 20px;
  border-bottom: 1.5px solid ${colors.light.soft.background};
`

exports.ModalTitle = styled(Txt)`
  flex-grow: 1;
`

exports.ModalBody = styled(Box)`
  padding: 20px;
  max-height: 250px;
  word-wrap: break-word;
  color: ${colors.light.foreground};
  background-color: ${colors.light.soft.background};
  margin: -35px 15px -35px 15px;
`

exports.CloseButton = styled(Button)`
  font-size: 19.5px;
  font-weight: bold;
  line-height: 1
  color: ${colors.light.soft.foreground};;
  cursor: pointer;
  &:hover {
    color: ${colors.dark.background};
  }
`