'use strict'

const secret = {
  handlers: Symbol('event handlers')
}

module.exports = function events (elem) {
  if (elem.nodeType !== 1) return
  elem.$require('code')
  elem.$using('events')

  elem[secret.handlers] = new Map()
  Array.prototype.forEach.call(elem.attributes, processEventAttribute, elem)
}

function processEventAttribute (attribute) {
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
