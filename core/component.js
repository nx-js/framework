'use strict'

const observer = require('@risingstack/nx-observe')
const onComponentInstanceAttached = require('./onComponentInstanceAttached')
const symbols = require('./symbols')

const config = Symbol('config')

module.exports = function component (rawConfig) {
  return {use, useOnContent, register, [config]: validateAndCloneConfig(rawConfig)}
}

function use (middleware) {
  if (typeof middleware !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  this[config].middlewares.push(middleware)
  return this
}

function useOnContent (contentMiddleware) {
  if (typeof contentMiddleware !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  this[config].contentMiddlewares.push(contentMiddleware)
  return this
}

function register (name) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  const parentProto = this[config].element ? this[config].elementProto : HTMLElement.prototype
  const proto = Object.create(parentProto)
  proto.attachedCallback = attachedCallback
  proto[config] = this[config]
  document.registerElement(name, {prototype: proto, extends: this[config].element})
  return name
}

function attachedCallback () {
  if (typeof this[config].state === 'object') {
    this[symbols.state] = this[config].state
  } else if (this[config].state === true) {
    this[symbols.state] = observer.observable()
  }
  if (this[config].state === 'inherit') {
    this[symbols.inheritState] = true
  }
  this[symbols.isolate] = this[config].isolate
  this[symbols.contentMiddlewares] = this[config].contentMiddlewares.slice()
  this[symbols.middlewares] = this[config].middlewares.slice()
  this[symbols.registered] = true

  onComponentInstanceAttached.call(this)
}

function validateAndCloneConfig (rawConfig) {
  if (rawConfig === undefined) {
    rawConfig = {}
  }
  if (typeof rawConfig !== 'object') {
    throw new TypeError('invalid component config, must be an object or undefined')
  }

  const resultConfig = {}

  if (typeof rawConfig.state === 'boolean' || rawConfig.state === 'inherit') {
    resultConfig.state = rawConfig.state
  } else if (typeof rawConfig.state === 'object' && observer.isObservable(rawConfig.state)) {
    resultConfig.state = rawConfig.state
  } else if (rawConfig.state === undefined) {
    resultConfig.state = true
  } else {
    throw new Error('invalid state config: ' + rawConfig.state)
  }

  if (typeof rawConfig.isolate === 'boolean' || rawConfig.isolate === 'middlewares') {
    resultConfig.isolate = rawConfig.isolate
  } else if (rawConfig.isolate === undefined) {
    resultConfig.isolate = false
  } else {
    throw new Error(`invalid isolate config: ${rawConfig.isolate}, must be a boolean or 'middlewares'`)
  }

  if (typeof rawConfig.element === 'string') {
    try {
      resultConfig.elementProto = Object.getPrototypeOf(document.createElement(rawConfig.element))
      resultConfig.element = rawConfig.element
    } catch (err) {
      throw new Error(`invalid element config: ${rawConfig.element}, must be the name of a native element`)
    }
  } else if (rawConfig.element !== undefined) {
    throw new Error(`invalid element config: ${rawConfig.element}, must be the name of a native element`)
  }

  resultConfig.contentMiddlewares = []
  resultConfig.middlewares = []
  return resultConfig
}
