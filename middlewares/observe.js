'use strict'

const observer = require('@risingstack/nx-observe')
const secret = {
  observers: Symbol('observers')
}
let prevState, prevContextState

function observe (node, state) {
  if (prevState !== state) {
    node.$state = observer.observable(state)
  }
  prevState = state

  const contextState = node.$contextState
  if (prevContextState !==  contextState) {
    node.$contextState = observer.observable(contextState)
  }
  prevContextState = contextState

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
