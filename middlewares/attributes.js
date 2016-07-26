'use strict'

const secret = {
  handlers: Symbol('attribute handlers')
}

module.exports = function attributes (elem, state, next) {
  if (!(elem instanceof Element)) {
    return next()
  }
  elem.$require('compile')
  elem.$using('attributes')

  elem.$attribute = $attribute
  next()
  handleAttributes(elem, state)
}

function $attribute (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  if (!this[secret.handlers]) {
    this[secret.handlers] = new Map()
  }
  this[secret.handlers].set(name, handler)
}

function handleAttributes (elem, state) {
  Array.prototype.forEach.call(elem.attributes, (attribute) => {
    if (attribute.name[0] === '$') {
      const expression = elem.$compileExpression(attribute.value)
      const name = attribute.name.slice(1)
      elem.removeAttribute(attribute.name)
      handleCompiledAttribute(elem, state, name, expression)
    } else if (attribute.name[0] === '@') {
      const expression = elem.$compileExpression(attribute.value)
      const name = attribute.name.slice(1)
      elem.removeAttribute(attribute.name)
      elem.$observe(() => handleCompiledAttribute(elem, state, name, expression))
    } else {
      const name = attribute.name
      const value = attribute.value
      handleNormalAttribute(elem, state, name, value)
    }
  })
}

function handleCompiledAttribute (elem, state, name, expression) {
  const value = expression(state)
  const handler = elem[secret.handlers].get(name)
  if (handler) {
    handler(value, name, elem, state)
  } else {
    elem.setAttribute(name, value)
  }
}

function handleNormalAttribute (elem, state, name, value) {
  const handler = elem[secret.handlers].get(name)
  if (handler) {
    handler(value, name, elem, state)
  }
}
