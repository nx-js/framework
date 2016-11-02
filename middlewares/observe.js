'use strict'

const observer = require('@risingstack/nx-observe')
const exposed = require('../core/symbols')

function observe (node) {
  // only do it when needed!!
  node[exposed.state] = observer.observable(node[exposed.state])
  node[exposed.contextState] = observer.observable(node[exposed.contextState])

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
  observer.observe(fn)
  this.$cleanup(() => observer.unobserve(fn))
}

function $unobserve (fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  observer.unobserve(fn)
}
