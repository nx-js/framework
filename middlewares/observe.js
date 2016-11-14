'use strict'

const observer = require('@risingstack/nx-observe')
const secret = {
  observers: Symbol('observers'),
  cleanupQueued: Symbol('cleanup queued')
}
let prevState

function observe (node, state) {
  if (prevState !== state) {
    node.$state = observer.observable(state)
    prevState = node.$state
  }
  if (prevState !== node.$contextState) {
    node.$contextState = observer.observable(node.$contextState)
    prevState = node.$contextState
  }

  node.$observe = $observe
  node.$unobserve = $unobserve
}
observe.$name = 'observe'
observe.$require = ['cleanup']
module.exports = observe

function $observe (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  this[secret.observers] = this[secret.observers] || []
  this[secret.observers].push(fn)
  observer.observe(fn)

  if (!this[secret.cleanupQueued]) {
    this.$cleanup(cleanupObservers)
    this[secret.cleanupQueued] = true
  }
}

function cleanupObservers (node) {
  node[secret.observers].forEach(observer.unobserve)
}

function $unobserve (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  observer.unobserve(fn)
}
