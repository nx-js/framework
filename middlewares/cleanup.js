'use strict'

function cleanup (node) {
  node.$cleanup = $cleanup
}
cleanup.$name = 'cleanup'
module.exports = cleanup

function $cleanup (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  this.$cleanupFunctions = this.$cleanupFunctions || []
  this.$cleanupFunctions.push(fn)
}
