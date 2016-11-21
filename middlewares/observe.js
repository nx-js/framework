'use strict'

const observer = require('@risingstack/nx-observe')
let prevState

function observe (node, state) {
  if (prevState !== state) {
    prevState = node.$state = observer.observable(state)
  }
  if (prevState !== node.$contextState) {
    prevState = node.$contextState = observer.observable(node.$contextState)
  }

  node.$observe = $observe
  node.$unobserve = observer.unobserve
}
observe.$name = 'observe'
module.exports = observe

function $observe (fn, args) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  const signal = observer.observe(fn, this, args)
  this.$cleanup(observer.unobserve, [signal])
  return signal
}
