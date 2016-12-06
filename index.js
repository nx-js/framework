'use strict'

var nx

if (typeof Proxy === 'undefined') {
  nx = { supported: false }
} else {
  require('./polyfills')

  nx = {
    component: require('./core'),
    middlewares: require('./middlewares'),
    components: require('./components'),
    filters: require('./filters'),
    limiters: require('./limiters'),
    observer: require('@risingstack/nx-observe'),
    compiler: require('@risingstack/nx-compile'),
    supported: true
  }
  for (let name in nx.filters) {
    nx.middlewares.expression.filter(name, nx.filters[name])
  }
  for (let name in nx.limiters) {
    nx.middlewares.code.limiter(name, nx.limiters[name])
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = nx
}
if (typeof window !== 'undefined') {
  window.nx = nx
}
