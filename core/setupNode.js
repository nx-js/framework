'use strict'

const observer = require('@risingstack/nx-observe')
const symbols = require('./symbols')

module.exports = function setupNode (node) {
  node.$cleanup = $cleanup
  node.$observe = $observe
  node.$unobserve = $unobserve
}

function $cleanup (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  let cleanupFunctions = this[symbols.cleanupFunctions]
  if (!cleanupFunctions) {
    cleanupFunctions = this[symbols.cleanupFunctions] = []
  }
  cleanupFunctions.push(fn)
}

function $observe (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  observer.observe(fn)
  this.$cleanup(() => observer.unobserve(fn))
}

function $unobserve (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  observer.unobserve(fn)
}
