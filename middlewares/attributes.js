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
      attributes = elem.attributes
      attributeCache.set(cloneId, attributes)
    }
    return attributes
  }
  return elem.attributes
}

function handleAttributes (elem, attributes) {
  let i = attributes.length
  while (i--) {
    const attribute = attributes[i]
    const type = attribute.name[0]
    if (type === '@' || type === '$') {
      const name = attribute.name.slice(1)
      const handler = handlers.get(name) || defaultHandler
      handleAttribute(name, attribute.value, type, handler, elem)
    } else {
      const name = attribute.name
      const handler = handlers.get(name)
      if (handler) {
        handleAttribute(name, attribute.value, '', handler, elem)
      }
    }
  }
}

function defaultHandler (value, elem, name) {
  if (value) {
    elem.setAttribute(name, value)
  } else {
    elem.removeAttribute(name)
  }
}

function expressionHandler (expression, handler, elem, name) {
  const value = expression(elem.$contextState)
  handler.call(elem, value, elem, name)
}

function handleAttribute (name, value, type, handler, elem) {
  if (type === '@') {
    const expression = elem.$compileExpression(value || name)
    elem.$observe(expressionHandler, expression, handler, elem, name)
  } else if (type === '$') {
    const expression = elem.$compileExpression(value || name)
    expressionHandler(expression, handler, elem, name)
  } else {
    handler.call(elem, value, elem, name)
  }
}
