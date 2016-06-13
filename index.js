'use strict'

require('./polyfills')

const {component, symbols} = require('./core')
const middlewares = require('./middlewares')
const components = require('./components')
const observer = require('@risingstack/nx-observe')
const compiler = require('@risingstack/nx-compile')

const nx = {
  component,
  symbols,
  middlewares,
  components,
  observer,
  compiler
}

if (module && module.exports) {
  module.exports = nx
}
if (window) {
  window.nx = nx
}
