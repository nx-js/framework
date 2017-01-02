'use strict'

var nx

if (typeof Proxy === 'undefined') {
  nx = { supported: false }
} else {
  nx = {
    component: require('@nx-js/core'),
    middlewares: require('./middlewares'),
    components: require('./components'),
    utils: require('./utils'),
    supported: true
  }

  require('@nx-js/filters')
  require('@nx-js/limiters')
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = nx
}
if (typeof window !== 'undefined') {
  window.nx = nx
}
