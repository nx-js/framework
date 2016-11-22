'use strict'

const handlers = new Map()
const attributeCache = new Map()

function attributes (elem, state, next) {
  if (elem.nodeType !== 1) return

  handlers.clear()
  elem.$attribute = $attribute
  next()
  handleAttributes(elem, getAttributes(elem))
}
attributes.$name = 'attributes'
attributes.$require = ['observe', 'expression']
module.exports = attributes

function $attribute (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  handlers.set(name, handler)
}

function getAttributes (elem) {
  const cloneId = elem.getAttribute('clone-id')
  if (cloneId) {
    let attributes = attributeCache.get(cloneId)
    if (!attributes) {
      attributes = Array.prototype.map.call(elem.attributes, cacheAttribute)
      attributeCache.set(cloneId, attributes)
    }
    return attributes
  }
  return elem.attributes
}

function cacheAttribute (attr) {
  return {name: attr.name, value: attr.value}
}

function handleAttributes (elem, attributes) {
  let i = attributes.length
  while (i--) {
    const attr = attributes[i]
    const type = attr.name[0]

    if (type === '@') {
      attr.$name = attr.$name || attr.name.slice(1)
      attr.$expression = attr.$expression || elem.$compileExpression(attr.value || attr.$name)
      const handler = handlers.get(attr.$name) || defaultHandler
      elem.$observe(expressionHandler, attr, handler)
      continue
    }

    if (type === '$') {
      attr.$name = attr.$name || attr.name.slice(1)
      attr.$expression = attr.$expression || elem.$compileExpression(attr.value || attr.$name)
      const handler = handlers.get(attr.$name) || defaultHandler
      expressionHandler.call(elem, attr, handler)
      continue
    }

    const handler = handlers.get(attr.name)
    if (handler) {
      handler.call(elem, attr.value, attr.name)
    }
  }
}

function defaultHandler (value, name) {
  if (value) {
    this.setAttribute(name, value)
  } else {
    this.removeAttribute(name)
  }
}

function expressionHandler (attr, handler) {
  const value = attr.$expression(this.$contextState)
  handler.call(this, value, attr.$name)
}
