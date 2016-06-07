'use strict'

require('./polyfills')

const {component, symbols} = require('./core')
const middlewares = require('./middlewares')
const components = require('./components')
const observer = require('@risingstack/nx-observe')
const compiler = require('@risingstack/nx-compile')

module.exports = {
  component,
  symbols,
  middlewares,
  components,
  observer,
  compiler
}
