'use strict'

const secret = {
  handlers: Symbol('attribute handlers')
}

function attributes (elem, state, next) {
  if (elem.nodeType !== 1) return

  elem[secret.handlers] = []
  elem.$attribute = $attribute
  next()

  processAttributesWithoutHandler(elem)
  elem[secret.handlers].forEach(processAttributeWithHandler, elem)
}
attributes.$name = 'attributes'
attributes.$require = ['expression']
module.exports = attributes

function $attribute (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  let value = this.getAttribute(name)
  if (value !== null) {
    this[secret.handlers].push({type: 'normal', value, name, handler})
    return
  }

  const observedName = '@' + name
  value = this.getAttribute(observedName)
  if (value !== null) {
    this[secret.handlers].push({type: 'observed', value, name, handler})
    this.removeAttribute(observedName)
  }

  const onceName = '$' + name
  value = this.getAttribute(onceName)
  if (value !== null) {
    this[secret.handlers].push({type: 'once', value, name, handler})
    this.removeAttribute(onceName)
    return
  }
}

function processAttributesWithoutHandler (elem) {
  const attributes = elem.attributes
  for (let i = attributes.length; i--;) {
    const attribute = attributes[i]
    if (attribute.name[0] === '$') {
      const name = attribute.name.slice(1)
      const expression = elem.$compileExpression(attribute.value || name)
      defaultHandler(elem, name, expression)
      elem.removeAttribute(attribute.name)
    } else if (attribute.name[0] === '@') {
      const name = attribute.name.slice(1)
      const expression = elem.$compileExpression(attribute.value || name)
      elem.$observe(() => defaultHandler(this, name, expression))
      elem.removeAttribute(attribute.name)
    }
  }
}

function defaultHandler (elem, name, expression) {
  const value = expression()
  if (value) {
    elem.setAttribute(name, value)
  } else {
    elem.removeAttribute(name)
  }
}

function processAttributeWithHandler (handler) {
  if (handler.type === 'normal') {
    handler.handler(handler.value, this)
  } else if (handler.type === 'once') {
    const expression = this.$compileExpression(handler.value || handler.name)
    handler.handler(expression(), this)
  } else if (handler.type === 'observed') {
    const expression = this.$compileExpression(handler.value || handler.name)
    this.$observe(() => handler.handler(expression(), this))
  }
}
