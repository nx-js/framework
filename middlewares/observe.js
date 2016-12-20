'use strict'

const observer = require('@risingstack/nx-observe')

function observe (node, state) {
  node.$contextState = observer.observable(node.$contextState)
  node.$state = observer.observable(node.$state)

  node.$observe = $observe
  node.$queue = $queue
  node.$unobserve = observer.unobserve
}
observe.$name = 'observe'
module.exports = observe

function $observe (fn, ...args) {
  args.unshift(fn, this)
  const signal = observer.observe.apply(null, args)
  this.$cleanup(observer.unobserve, signal)
  return signal
}

function $queue (fn, ...args) {
  args.unshift(fn, this)
  return observer.queue.apply(null, args)
}
