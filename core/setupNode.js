'use strict'

const observer = require('@risingstack/nx-observe')
const symbols = require('./symbols')

module.exports = function setupNode (node) {
  node[symbols.cleanupFunctions] = []
  node[symbols.usedMiddlewareNames] = new Set()

  node.$using = $using
  node.$isUsing = $isUsing
  node.$require = $require
  node.$cleanup = $cleanup
  node.$observe = $observe
  node.$unobserve = $unobserve
  node.$schedule = $schedule
}

function $using (...middlewareNames) {
  const duplicateMiddlewareNames = []

  for (let middlewareName of middlewareNames) {
    if (this[symbols.usedMiddlewareNames].has(middlewareName)) {
      duplicateMiddlewareNames.push(middlewareName)
    } else {
      this[symbols.usedMiddlewareNames].add(middlewareName)
    }
  }
  if (duplicateMiddlewareNames.length) {
    throw new Error(`duplicate middlewares in ${this}: ${duplicateMiddlewareNames}`)
  }
}

function $isUsing (...middlewareNames) {
  for (let middlewareName of middlewareNames) {
    if (!this[symbols.usedMiddlewareNames].has(middlewareName)) {
      return false
    }
  }
  return true
}

function $require (...middlewareNames) {
  const missingMiddlewareNames = []

  for (let middlewareName of middlewareNames) {
    if (!this[symbols.usedMiddlewareNames].has(middlewareName)) {
      missingMiddlewareNames.push(middlewareName)
    }
  }
  if (missingMiddlewareNames.length) {
    throw new Error(`missing required middlewares in ${this}: ${missingMiddlewareNames}`)
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

function $schedule (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  requestAnimationFrame(fn)
}
