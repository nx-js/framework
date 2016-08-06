'use strict'

const compiler = require('@risingstack/nx-compile')

const secret = {
  handlers: Symbol('event handlers'),
  state: Symbol('event state')
}

module.exports = function events (elem, state, next) {
  if (!(elem instanceof Element)) return next()
  elem.$require('code')
  elem.$using('events')

  next()

  for (let i = 0; i < elem.attributes.length; i++) {
    const attribute = elem.attributes[i]

    if (attribute.name[0] === '#') {
      const handler = elem.$compileCode(attribute.value)

      if (!elem[secret.handlers]) {
        elem[secret.handlers] = new Map()
        elem[secret.state] = state
      }

      const names = attribute.name.slice(1).split(',')
      for (let name of names) {
        elem[secret.handlers].set(name, handler)
        elem.addEventListener(name, listener)
      }
    }
  }
}

function listener (event) {
  const handler = event.target[secret.handlers].get(event.type)
  const state = event.target[secret.state]
  handler(state, event)
}
