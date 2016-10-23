'use strict'

const observer = require('@risingstack/nx-observe')
const validateConfig = require('./validateConfig')
const getContext = require('./getContext')
const onNodeAdded = require('./onNodeAdded')
const onNodeRemoved = require('./onNodeRemoved')
const symbols = require('./symbols')

const secret = {
  config: Symbol('component config'),
  contentWatcher: Symbol('content watcher')
}
const contentWatcherConfig = {
  childList: true,
  subtree: true
}

module.exports = function component (rawConfig) {
  return {use, useOnContent, register, [secret.config]: validateConfig(rawConfig)}
}

function use (middleware) {
  if (typeof middleware !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  this[secret.config].middlewares.push(middleware)
  return this
}

function useOnContent (contentMiddleware) {
  if (typeof contentMiddleware !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  this[secret.config].contentMiddlewares.push(contentMiddleware)
  return this
}

function register (name) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  const parentProto = this[secret.config].element ? this[secret.config].elementProto : HTMLElement.prototype
  const proto = Object.create(parentProto)
  proto[secret.config] = this[secret.config]
  proto.attachedCallback = attachedCallback
  proto.detachedCallback = detachedCallback
  return document.registerElement(name, {prototype: proto, extends: this[secret.config].element})
}

function attachedCallback () {
  if (!this[symbols.registered]) {
    if (typeof this[secret.config].state === 'object') {
      this[symbols.state] = this[secret.config].state
    } else if (this[secret.config].state === true) {
      this[symbols.state] = observer.observable()
    }
    if (this[secret.config].state === 'inherit') {
      this[symbols.inheritState] = true
    }

    this[symbols.isolate] = this[secret.config].isolate
    this[symbols.contentMiddlewares] = this[secret.config].contentMiddlewares.slice()
    this[symbols.middlewares] = this[secret.config].middlewares.slice()
    this[symbols.root] = this[secret.config].root
    this[symbols.registered] = true

    if (this[symbols.root]) {
      this[secret.contentWatcher] = new MutationObserver(onMutations)
      this[secret.contentWatcher].observe(this, contentWatcherConfig)
    }
    // it might be synchronous -> doesn't belong here -> should add it to the queue
    const context = getContext(this.parentNode)
    onNodeAdded.call(context, this)
  }
}

function detachedCallback () {
  if (this[secret.contentWatcher]) {
    this[secret.contentWatcher].disconnect()
  }
  onNodeRemoved(this)
}

function onMutations (mutations, contentWatcher) {
  for (let mutation of mutations) {
    const context = getContext(mutation.target)
    Array.prototype.forEach.call(mutation.removedNodes, onNodeRemoved)
    Array.prototype.forEach.call(mutation.addedNodes, onNodeAdded, context)
  }
  mutations = contentWatcher.takeRecords()
  if (mutations.length) {
    onMutations(mutations, contentWatcher)
  }
}
