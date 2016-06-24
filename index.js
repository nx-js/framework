'use strict'

if (window === undefined) {
  throw new Error('nx can only be used in a browser')
}
if (window.Proxy === undefined) {
  throw new Error('nx does not support this browser')
}

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
