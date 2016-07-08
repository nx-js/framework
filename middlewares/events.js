'use strict'

const compiler = require('@risingstack/nx-compile')

const eventState = Symbol('eventState')
const eventHandlers = Symbol('eventHandlers')
const eventNames = ['keypress', 'click', 'dblclick', 'mouseover', 'mouseout', 'scroll',
  'blur', 'focus', 'change', 'input', 'invalid', 'reset', 'select', 'submit']

module.exports = function events (elem, state, next) {
  if (!(elem instanceof Element)) {
    return next()
  }
  elem.$using('events')

  for (let eventName of eventNames) {
    if (elem.hasAttribute(`nx-${eventName}`)) {
      setupHandler(elem, state, eventName)
    }
  }
  return next()
}

function setupHandler (elem, state, eventName) {
  if (!elem[eventState]) {
    elem[eventState] = state
  }
  if (!elem[eventHandlers]) {
    elem[eventHandlers] = new Map()
  }
  const handler = compiler.compileCode(elem.getAttribute(`nx-${eventName}`))
  elem[eventHandlers].set(eventName, handler)
  elem.addEventListener(eventName, onEvent)
}

function onEvent (ev) {
  const eventName = ev.type.toLowerCase()
  if (ev.target[eventHandlers] && ev.target[eventHandlers].has(eventName)) {
    const handler = ev.target[eventHandlers].get(eventName)
    const state = ev.target[eventState]

    const $eventBackup = state.$event
    state.$event = ev
    try {
      handler(state)
    } finally {
      state.$event = $eventBackup
    }
  }
}
