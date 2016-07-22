'use strict'

const symbols = require('../core/symbols')

module.exports = function filterFactory (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  return function filter (node, state, next) {
    node.$require('evaluate')
    if (!node.$isUsing('filter')) {
      node.$using('filter')
      node[symbols.filters] = new Map()
    }

    if (node[symbols.filters].has(name)) {
      throw new Error(`a filter named ${name} already exists on ${node}`)
    }
    node[symbols.filters].set(name, handler)
    return next()
  }
}
