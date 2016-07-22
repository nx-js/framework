'use strict'

module.exports = function attributes (elem, state, next) {
  if (!(elem instanceof Element)) {
    return next()
  }
  elem.$require('evaluate')
  elem.$using('attributes')

  elem.$attribute = $attribute
  return next()
}

function $attribute (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  if (this.hasAttribute('@' + name)) {
    this.$evalExpression(this.getAttribute('@' + name), handler, true)
  } else if (this.hasAttribute('$' + name)) {
    this.$evalExpression(this.getAttribute('$' + name), handler, false)
  } else if (this.hasAttribute(name)) {
    throw new Error(`custom attribute ${name} must start with $ or @`)
  }
}
