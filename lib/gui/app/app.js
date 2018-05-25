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

/**
 * @module Etcher
 */

'use strict'

document.addEventListener('DOMContentLoaded', () => {
  const electron = require('electron')
  const React = require('react')
  const ReactDOM = require('react-dom')
  const FileSelector = require('./components/file-selector/file-selector/file-selector.jsx')
  const rendition = require('rendition')

  ReactDOM.render((
    <button
      primary
      onClick={ () => document.body.style.background = 'pink' }
      onTouchStart={ () => document.body.style.background = 'green' }
      onTouchEnd={ () => document.body.style.background = 'red' }
    >Hello, world!</button>
  ), document.body)

  const handleEvent = (event) => {
    event.preventDefault()
    const elem = document.createElement('div')
    const [ x, y ] = [ event.touches[0].clientX || event.clientX, event.touches[0].clientY || event.clientY ]
    elem.textContent = `${event.type} @ ${x}x${y}`
    document.body.appendChild(elem)
  }
  document.ontouchstart = handleEvent
  document.ontouchend = handleEvent
  document.onmousedown = handleEvent
  document.onmouseup = handleEvent
  document.body.style.height = '100vh'
  document.body.style.width = '100vw'
  console.log(JSON.stringify(process.env, null, 2))
})
