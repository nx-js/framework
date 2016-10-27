'use strict'

const observer = require('@risingstack/nx-observe')
const symbols = require('./symbols')

module.exports = function setupNode (node) {
  node[symbols.cleanupFunctions] = []
  node[symbols.usedMiddlewareNames] = new Set()

  node.$using = $using
  node.$require = $require
  node.$cleanup = $cleanup
  node.$observe = $observe
  node.$unobserve = $unobserve
}

function $using (middlewareName) {
  const usedMiddlewareNames = this[symbols.usedMiddlewareNames]
  if (usedMiddlewareNames.has(middlewareName)) {
    throw new Error(`duplicate middleware: ${middlewareName}`)
  }
  usedMiddlewareNames.add(middlewareName)
}

function $require (middlewareName) {
  if (!this[symbols.usedMiddlewareNames].has(middlewareName)) {
    throw new Error(`missing required middleware: ${middlewareName}`)
  }
}

function $cleanup (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  this[symbols.cleanupFunctions].push(fn)
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
