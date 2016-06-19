'use strict'

require('./polyfills')

if (document) {
  const style = document.createElement('style')
  style.appendChild(document.createTextNode('[nx-cloak] { display: none; }'))
  document.head.appendChild(style)
}

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
if (window) {
  window.nx = nx
}
