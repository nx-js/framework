'use strict'

const handlers = new Map()
const attributeCache = new Map()

function attributes (elem, state, next) {
  if (elem.nodeType !== 1) return

  handlers.clear()
  elem.$attribute = $attribute
  next()
  const attributes = getAttributes(elem)
  handleAttributes(elem, attributes)
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
      attributes = cloneAttributes(elem)
      attributeCache.set(cloneId, attributes)
    }
    return attributes
  }
  return elem.attributes
}

function cloneAttributes (elem) {
  const attributes = elem.attributes
  const clonedAttributes = []
  for (let i = attributes.length; i--;) {
    const attribute = attributes[i]
    clonedAttributes.push({name: attribute.name, value: attribute.value})
  }
  return clonedAttributes
}

function handleAttributes (elem, attributes) {
  const contextState = elem.$contextState
  const attributesToHandle = []

  for (let i = attributes.length; i--;) {
    const attribute = attributes[i]
    attribute.type = attribute.name[0]
    if (attribute.type === '$' || attribute.type === '@') {
      attribute.$name = attribute.name.slice(1)
      attribute.handler = handlers.get(attribute.$name) || defaultHandler
    } else {
      attribute.handler = handlers.get(attribute.name)
    }
    if (attribute.handler === defaultHandler) {
      attributesToHandle.unshift(attribute)
    } else if (attribute.handler) {
      attributesToHandle.push(attribute)
    }
  }
  attributesToHandle.forEach(handleAttribute, elem)
}

function defaultHandler (value, elem, name) {
  if (value) {
    elem.setAttribute(name, value)
  } else {
    elem.removeAttribute(name)
  }
}

function handleAttribute (attribute) {
  if (attribute.type === '$') {
    const expression = this.$compileExpression(attribute.value || attribute.$name)
    attribute.$handler(expression(this.$contextState), this, attribute.$name)
  } else if (attribute.type === '@') {
    const expression = this.$compileExpression(attribute.value || attribute.$name)
    this.$observe(() => attribute.handler(expression(this.$contextState), this, attribute.$name))
  } else {
    attribute.handler(attribute.value, this, attribute.name)
  }
}
