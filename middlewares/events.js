'use strict'

const secret = {
  events: Symbol('event type')
}
const handledEvents = new Set()

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
        events = new Map()
        elem[secret.events] = events
      }
      for (let name of names) {
        let handlers = events.get(name)
        if (!handlers) {
          handlers = new Set()
          events.set(name, handlers)
        }
        handlers.add(handler)
        if (!handledEvents.has(name)) {
          document.addEventListener(name, listener, true)
          handledEvents.add(name)
        }
      }
      elem.removeAttribute(attribute.name)
    }
  }
}

function listener (event) {
  const type = event.type
  let node = event.target
  while (node) {
    runHandler(node, event, type)
    if (node.$root) {
      return
    }
    node = node.parentNode
  }
}

function runHandler (node, event, type) {
  const events = node[secret.events]
  if (events) {
    const handlers = events.get(type)
    if (handlers) {
      for (let handler of handlers) {
        handler(node.$contextState, { $event: event })
      }
    }
  }
}
