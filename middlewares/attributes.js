'use strict'

let currAttributes
const handlers = new Map()
const attributeCache = new Map()

function attributes (elem, state, next) {
  if (elem.nodeType !== 1) return

  currAttributes = getAttributes(elem)
  elem.$attribute = $attribute
  next()

  currAttributes.forEach(processAttributeWithoutHandler, elem)
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
  if (currAttributes.has(name)) {
    handlers.set(name, handler)
  }
}

function getAttributes (elem) {
  const cloneId = elem.getAttribute('clone-id')
  let attributes
  if (cloneId) {
    attributes = attributeCache.get(cloneId)
    if (!attributes) {
      attributes = cacheAttributes(elem.attributes)
      attributeCache.set(cloneId, attributes)
    }
    return attributes
  }
  return cacheAttributes(elem.attributes)
}

function cacheAttributes (attributes) {
  let i = attributes.length
  const cachedAttributes = new Map()
  while (i--) {
    const attribute = attributes[i]
    const type = attribute.name[0]
    const name = (type === '$' || type === '@') ? attribute.name.slice(1) : attribute.name
    cachedAttributes.set(name, {value: attribute.value, type})
  }
  return cachedAttributes
}

function processAttributeWithoutHandler (attr, name) {
  if (!handlers.has(name)) {
    if (attr.type === '$') {
      const expression = this.$compileExpression(attr.value || name)
      processExpression.call(this, expression, name, defaultHandler)
    } else if (attr.type === '@') {
      const expression = this.$compileExpression(attr.value || name)
      this.$observe(processExpression, expression, name, defaultHandler)
    }
  }
}

function processAttributeWithHandler (handler, name) {
  const attr = currAttributes.get(name)
  if (attr.type === '@') {
    const expression = this.$compileExpression(attr.value)
    this.$observe(processExpression, expression, name, handler)
  } else if (attr.type === '$') {
    const expression = this.$compileExpression(attr.value)
    processExpression.call(this, expression, name, handler)
  } else {
    handler.call(this, attr.value, name)
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
