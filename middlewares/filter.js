'use strict'

const exposed = require('../core/symbols')

module.exports = function filterFactory (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  function filter (node) {
    let filters = node[exposed.filters]
    if (!filters) {
      filters = node[exposed.filters] = new Map()
    }
    filters.set(name, handler)
  }
  filter.$require = ['expression']
  return filter
}
