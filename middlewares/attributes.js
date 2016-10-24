'use strict'

const secret = {
  handlers: Symbol('attribute handlers')
}

module.exports = function attributes (elem, state, next) {
  if (!(elem instanceof Element)) return
  elem.$require('expression')
  elem.$using('attributes')

  elem[secret.handlers] = []
  elem.$attribute = $attribute

  next()

  processAttributesWithoutHandler(elem)
  processAttributesWithHandler(elem)
}

function $attribute (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  if (!this.hasAttributes()) {
    return
  }
  const handlers = this[secret.handlers]

  if (this.hasAttribute(name)) {
    handlers.push({type: 'normal', value: this.getAttribute(name), name, handler})
    return
  }

  const onceName = '$' + name
  if (this.hasAttribute(onceName)) {
    handlers.push({type: 'once', value: this.getAttribute(onceName), name, handler})
    this.removeAttribute(onceName)
    return
  }

  const observedName = '@' + name
  if (this.hasAttribute(observedName)) {
    handlers.push({type: 'observed', value: this.getAttribute(observedName), name, handler})
    this.removeAttribute(observedName)
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
      elem.$observe(() => defaultHandler(elem, name, expression))
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

function processAttributesWithHandler (elem) {
  for (let handler of elem[secret.handlers]) {
    if (handler.type === 'normal') {
      handler.handler(handler.value, elem)
    } else if (handler.type === 'once') {
      const expression = elem.$compileExpression(handler.value || handler.name)
      handler.handler(expression(), elem)
    } else if (handler.type === 'observed') {
      const expression = elem.$compileExpression(handler.value || handler.name)
      elem.$observe(() => handler.handler(expression(), elem))
    }
  }
}
