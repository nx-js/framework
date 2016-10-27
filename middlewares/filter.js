'use strict'

const exposed = require('../core/symbols')

module.exports = function filterFactory (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  return function filter (node) {
    node.$require('expression')
    node[exposed.filters].set(name, handler)
  }
}
