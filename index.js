'use strict'

require('./polyfills')
const core = require('./core')

window.nx = {}

nx.component = core.component
nx.symbols = core.symbols
nx.observer = require('@risingstack/nx-observe')
nx.compiler = require('@risingstack/nx-compile')
nx.filters = require('./filters')
nx.limiters = require('./limiters')
nx.middlewares = require('./middlewares')
nx.components = require('./components')

if (module && module.exports) {
  module.exports = nx
}
