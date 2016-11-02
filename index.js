'use strict'

require('./polyfills')

window.nx = {}

nx.component = require('./core')
nx.observer = require('@risingstack/nx-observe')
nx.compiler = require('@risingstack/nx-compile')
nx.filters = require('./filters')
nx.limiters = require('./limiters')
nx.middlewares = require('./middlewares')
nx.components = require('./components')

if (module && module.exports) {
  module.exports = nx
}
