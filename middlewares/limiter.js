'use strict'

const exposed = require('../core/symbols')

module.exports = function limiterFactory (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  return function limiter (node, state, next) {
    node.$require('compile')
    if (!node.$isUsing('limiter')) {
      node.$using('limiter')
    }
    if (!node[exposed.limiters]) {
      node[exposed.limiters] = new Map()
    }

    node[exposed.limiters].set(name, handler)
    return next()
  }
}
