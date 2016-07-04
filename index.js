'use strict'

require('./polyfills')
const core = require('./core')

const nx = {
  component: core.component,
  symbols: core.symbols,
  middlewares: require('./middlewares'),
  components: require('./components'),
  observer: require('@risingstack/nx-observe'),
  compiler: require('@risingstack/nx-compile')
}

if (module && module.exports) {
  module.exports = nx
}
window.nx = nx
