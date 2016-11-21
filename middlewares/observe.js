'use strict'

const observer = require('@risingstack/nx-observe')
const secret = {
  observers: Symbol('observers')
}
const observers = new WeakMap()
let prevState

function observe (node, state) {
  node.$state = observer.observable(state)
  node.$contextState = observer.observable(node.$contextState)

  node.$observe = $observe
  node.$unobserve = observer.unobserve
}
observe.$name = 'observe'
observe.$require = ['cleanup']
module.exports = observe

function $observe (fn, ...args) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  if (!this[secret.observers]) {
    this.$cleanup(cleanupObservers)
    this[secret.observers] = []
  }
  this[secret.observers].push(observer.observe(fn, this, ...args))
}

function cleanupObservers (node) {
  node[secret.observers].forEach(observer.unobserve)
}
