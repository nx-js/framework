'use strict'

const secret = {
  events: Symbol('event type')
}

function events (elem) {
  if (elem.nodeType !== 1) return
  processEventAttributes(elem)
}
events.$name = 'events'
events.$require = ['code']
module.exports = events

function processEventAttributes (elem) {
  const attributes = elem.attributes
  for (let i = attributes.length; i--;) {
    const attribute = attributes[i]
    if (attribute.name[0] === '#') {
      const handler = elem.$compileCode(attribute.value)
      const names = attribute.name.slice(1).split(',')
      let events = elem[secret.events]
      if (!events) {
        events = elem[secret.events] = new Map()
      }
      for (let name of names) {
        let handlers = events.get(name)
        if (!handlers) {
          handlers = new Set()
          events.set(name, handlers)
        }
        handlers.add(handler)
        elem.addEventListener(name, listener, true)
      }
      elem.removeAttribute(attribute.name)
    }
  }
}

function listener (event) {
  const handlers = this[secret.events].get(event.type)
  for (let handler of handlers) {
    handler({ $event: event })
  }
}
