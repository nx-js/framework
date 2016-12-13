'use strict'

const secret = {
  handlers: Symbol('event handlers')
}
const handlerCache = new Map()

function events (elem) {
  if (elem.nodeType !== 1) return

  const handlers = getEventHandlers(elem)
  if (handlers) {
    handlers.forEach(addEventHandlers, elem)
    elem[secret.handlers] = handlers
  }
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
  let handlers = false
  const attributes = elem.attributes
  let i = attributes.length
  while (i--) {
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
      }
    }
  }
  return handlers
}

function addEventHandlers (handlers, type) {
  this.addEventListener(type, listener, true)
}

function listener (ev) {
  const handlers = this[secret.handlers].get(ev.type)
  for (let handler of handlers) {
    handler(this.$contextState, { $event: ev })
  }
}
