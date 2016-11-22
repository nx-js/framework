'use strict'

require('./polyfills')

const nx = {
  component: require('./core'),
  middlewares: require('./middlewares'),
  components: require('./components'),
  filters: require('./filters'),
  limiters: require('./limiters'),
  observer: require('@risingstack/nx-observe'),
  compiler: require('@risingstack/nx-compile')
}

for (let name in nx.filters) {
  nx.middlewares.expression.filter(name, nx.filters[name])
}

for (let name in nx.limiters) {
  nx.middlewares.code.limiter(name, nx.limiters[name])
}

if (module && module.exports) {
  module.exports = nx
}
if (window) {
  window.nx = nx
}
