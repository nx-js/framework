'use strict'

const compiler = require('@risingstack/nx-compile')
window.counter = 0
const secret = {
  handlers: Symbol('event handlers')
}

module.exports = function events (elem, state, next) {
  if (!(elem instanceof Element)) return
  elem.$require('code')
  elem.$using('events')

  elem[secret.handlers] = new Map()
  next()

  Array.prototype.forEach.call(elem.attributes, setupHandlers, elem)
}

function setupHandlers (attribute) {
  if (attribute.name[0] === '#') {
    const handler = this.$compileCode(attribute.value)
    const names = attribute.name.slice(1).split(',')
    for (let name of names) {
      let handlers = this[secret.handlers].get(name)
      if (!handlers) {
        handlers = new Set()
        this[secret.handlers].set(name, handlers)
      }
      handlers.add(handler)
      this.addEventListener(name, listener, true)
    }
    this.removeAttribute(attribute.name)
  }
}

function listener (event) {
  const handlers = this[secret.handlers].get(event.type)
  for (let handler of handlers) {
    handler({ $event: event })
  }
}
