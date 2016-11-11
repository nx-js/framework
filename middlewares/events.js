'use strict'

const secret = {
  handlers: Symbol('event handlers')
}
const handlerCache = new Map()
const handledEvents = new Set()

function events (elem) {
  if (elem.nodeType !== 1) return
  elem[secret.handlers] = getEventHandlers(elem)
}
events.$name = 'events'
events.$require = ['code']
module.exports = events

function getEventHandlers (elem) {
  const cloneId = elem.getAttribute('clone-id')
  if (cloneId) {
    let handlers = handlerCache.get(cloneId)
    if (handlers === undefined) {
      handlers = createEventHandlers(elem)
      handlerCache.set(cloneId, handlers)
    }
    return handlers
  }
  return createEventHandlers(elem)
}

function createEventHandlers (elem) {
  const attributes = elem.attributes
  let handlers = false
  for (let i = attributes.length; i--;) {
    const attribute = attributes[i]
    if (attribute.name[0] === '#') {
      handlers = handlers || new Map()
      const handler = elem.$compileCode(attribute.value)
      const names = attribute.name.slice(1).split(',')
      for (let name of names) {
        let typeHandlers = handlers.get(name)
        if (!typeHandlers) {
          typeHandlers = new Set()
          handlers.set(name, typeHandlers)
        }
        typeHandlers.add(handler)
        if (!handledEvents.has(name)) {
          document.addEventListener(name, listener, true)
          handledEvents.add(name)
        }
      }
    }
  }
  return handlers
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
  const handlers = node[secret.handlers]
  if (handlers) {
    const typeHandlers = handlers.get(type)
    if (typeHandlers) {
      for (let handler of typeHandlers) {
        handler(node.$contextState, { $event: event })
      }
    }
  }
}
