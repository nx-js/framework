'use strict'

const exposed = require('../core/symbols')

module.exports = function limiterFactory (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  function limiter (node) {
    node[exposed.limiters].set(name, handler)
  }
  limiter.$require = ['code']
  return limiter
}
