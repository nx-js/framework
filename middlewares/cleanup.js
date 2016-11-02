'use strict'

const exposed = require('../core/symbols')

function cleanup (node) {
  node.$cleanup = $cleanup
}
cleanup.$name = 'cleanup'
module.exports = cleanup

function $cleanup (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  let cleanupFunctions = this[exposed.cleanupFunctions]
  if (!cleanupFunctions) {
    cleanupFunctions = this[exposed.cleanupFunctions] = []
  }
  cleanupFunctions.push(fn)
}
