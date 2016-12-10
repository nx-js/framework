'use strict'

const handlers = new Map()
const attributeCache = new Map()

function attributes (elem, state, next) {
  if (elem.nodeType !== 1) return
  elem.$attribute = $attribute
  next()

  const attributes = getAttributes(elem)
  Array.prototype.forEach.call(attributes, processAttributeWithoutHandler, elem)
  handlers.forEach(processAttributeWithHandler, elem)
  handlers.clear()
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
  let attributes
  if (cloneId) {
    attributes = attributeCache.get(cloneId)
    if (!attributes) {
      attributes = Array.prototype.map.call(elem.attributes, cacheAttribute)
      attributeCache.set(cloneId, attributes)
    }
    return attributes
  }
  return elem.attributes
}

function cacheAttribute (attribute) {
  return {name: attribute.name, value: attribute.value}
}

function processAttributeWithoutHandler (attribute) {
  const type = attribute.name[0]
  if (type === '$') {
    const name = attribute.name.slice(1)
    if (!handlers.has(name)) {
      const expression = this.$compileExpression(attribute.value || name)
      processExpression.call(this, expression, name, defaultHandler)
    }
  } else if (type === '@') {
    const name = attribute.name.slice(1)
    if (!handlers.has(name)) {
      const expression = this.$compileExpression(attribute.value || name)
      this.$observe(processExpression, expression, name, defaultHandler)
    }
  }
}

function processAttributeWithHandler (handler, name) {
  let value = this.getAttribute(name)
  if (value) {
    handler.call(this, value, name)
    return
  }
  value = this.getAttribute('$' + name)
  if (value) {
    const expression = this.$compileExpression(value || name)
    processExpression.call(this, expression, name, handler)
    return
  }
  value = this.getAttribute('@' + name)
  if (value) {
    const expression = this.$compileExpression(value || name)
    this.$observe(processExpression, expression, name, handler)
  }
}

function processExpression (expression, name, handler) {
  const value = expression(this.$contextState)
  handler.call(this, value, name)
}

function defaultHandler (value, name) {
  if (value) {
    this.setAttribute(name, value)
  } else {
    this.removeAttribute(name)
  }
}
