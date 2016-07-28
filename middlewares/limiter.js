'use strict'

const exposed = require('../core/symbols')

module.exports = function limiterFactory (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  return function limiter (elem, state, next) {
    elem.$require('code')

    if (!elem[exposed.limiters]) {
      elem[exposed.limiters] = new Map()
    }
    elem[exposed.limiters].set(name, handler)
    return next()
  }
}
