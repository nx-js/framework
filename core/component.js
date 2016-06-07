'use strict'

const observer = require('@risingstack/nx-observe')
const onComponentInstanceAttached = require('./onComponentInstanceAttached')
const symbols = require('./symbols')

const config = Symbol('config')

module.exports = function component (rawConfig) {
  return {use, useOnChildren, register, [config]: validateAndCloneConfig(rawConfig)}
}

function use (middleware) {
  if (typeof middleware !== 'function') {
    throw new TypeError('first argument must be a function')
  }

  this[config].middlewares.push(middleware)
  return this
}

function useOnChildren (childrenMiddleware) {
  if (typeof childrenMiddleware !== 'function') {
    throw new TypeError('first argument must be a function')
  }

  this[config].childrenMiddlewares.push(childrenMiddleware)
  return this
}

function register (name) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }

  const proto = {
    createdCallback: onComponentInstantiated,
    attachedCallback: onComponentInstanceAttached
  }
  proto[config] = this[config]

  if (this[config].element) {
    Object.setPrototypeOf(proto, this[config].element)
  } else {
    Object.setPrototypeOf(proto, HTMLElement.prototype)
  }
  document.registerElement(name, {prototype: proto, extends: this[config].element})
  return name
}

function onComponentInstantiated () {
  if (typeof this[config].state === 'object') {
    this[symbols.state] = this[config].state
  } else if (this[config].state === true) {
    this[symbols.state] = observer.observable()
  }

  if (this[config].state === 'inherit') {
    this[symbols.inheritState] = true
  }

  this[symbols.isolateMiddlewares] = this[config].isolateMiddlewares
  this[symbols.childrenMiddlewares] = this[config].childrenMiddlewares.slice()
  this[symbols.middlewares] = this[config].middlewares.slice()
}

function validateAndCloneConfig (rawConfig = {}) {
  if (typeof rawConfig !== 'object') {
    throw new TypeError('invalid config, must be an object or undefined')
  }

  const resultConfig = {}

  if (typeof rawConfig.state === 'boolean' || rawConfig.state === 'inherit') {
    resultConfig.state = rawConfig.state
  } else if (typeof rawConfig.state === 'object' && observer.isObservable(rawConfig.state)) {
    resultConfig.state = rawConfig.state
  } else if (rawConfig.state === undefined) {
    resultConfig.state = true
  } else {
    throw new Error('invalid state config')
  }

  if (typeof rawConfig.isolateMiddlewares === 'boolean') {
    resultConfig.isolateMiddlewares = rawConfig.isolateMiddlewares
  } else if (rawConfig.isolateMiddlewares !== undefined) {
    throw new Error('invalid isolateMiddlewares config')
  }

  if (typeof rawConfig.element === 'string') {
    try {
      resultConfig.element = Object.getPrototypeOf(document.createElement(rawConfig.element))
    } catch (err) {
      throw new Error('invalid element config, must be the name of a native element')
    }
  } else if (rawConfig.element !== undefined) {
    throw new Error('invalid element config, must be the name of a native element')
  }

  resultConfig.childrenMiddlewares = []
  resultConfig.middlewares = []

  return resultConfig
}
