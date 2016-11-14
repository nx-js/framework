'use strict'

const validateConfig = require('./validateConfig')
const validateMiddlewares = require('./validateMiddlewares')
const getContext = require('./getContext')
const onNodeAdded = require('./onNodeAdded')
const onNodeRemoved = require('./onNodeRemoved')

const secret = {
  config: Symbol('component config'),
  contentWatcher: Symbol('content watcher')
}
const contentWatcherConfig = {
  childList: true,
  subtree: true
}
const addedNodes = new Set()

module.exports = function component (rawConfig) {
  return {use, useOnContent, register, [secret.config]: validateConfig(rawConfig)}
}

function use (middleware) {
  if (typeof middleware !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  const config = this[secret.config]
  config.middlewares = config.middlewares || []
  config.middlewares.push(middleware)
  return this
}

function useOnContent (contentMiddleware) {
  if (typeof contentMiddleware !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  const config = this[secret.config]
  if (config.isolate === true) {
    throw new Error('content middlewares can not be added to isolated components')
  }
  config.contentMiddlewares = config.contentMiddlewares || []
  config.contentMiddlewares.push(contentMiddleware)
  return this
}

function register (name) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  const config = this[secret.config]
  const parentProto = config.element ? config.elementProto : HTMLElement.prototype
  const proto = Object.create(parentProto)
  config.shouldValidate = validateMiddlewares(config.contentMiddlewares, config.middlewares)
  proto[secret.config] = config
  proto.attachedCallback = attachedCallback
  proto.detachedCallback = detachedCallback
  return document.registerElement(name, {prototype: proto, extends: config.element})
}

function attachedCallback () {
  const config = this[secret.config]
  if (!this.$registered) {
    if (typeof config.state === 'object') {
      this.$state = config.state
    } else if (config.state === true) {
      this.$state = {}
    } else if (config.state === 'inherit') {
      this.$state = {}
      this.$inheritState = true
    }

    this.$isolate = config.isolate
    this.$contentMiddlewares = config.contentMiddlewares
    this.$middlewares = config.middlewares
    this.$shouldValidate = config.shouldValidate
    this.$registered = true

    if (config.root) {
      this.$root = true
      this[secret.contentWatcher] = new MutationObserver(onMutations)
      this[secret.contentWatcher].observe(this, contentWatcherConfig)
      onNodeAdded(this, getContext(this.parentNode))
    } else {
      if (addedNodes.size === 0) {
        Promise.resolve().then(processAddedNodes)
      }
      addedNodes.add(this)
    }
  }
}

function detachedCallback () {
  if (this[secret.contentWatcher]) {
    this[secret.contentWatcher].disconnect()
    onNodeRemoved(this)
  }
}

function onMutations (mutations, contentWatcher) {
  for (let mutation of mutations) {
    for (let i = mutation.removedNodes.length; i--;) {
      onNodeRemoved(mutation.removedNodes[i])
    }
    for (let i = mutation.addedNodes.length; i--;) {
      const addedNode = mutation.addedNodes[i]
      if (addedNode.nodeType < 4) {
        addedNodes.add(addedNode)
      }
    }
  }
  processAddedNodes()
}

function processAddedNodes () {
  let context
  let prevParent
  for (let addedNode of addedNodes) {
    if (prevParent !== addedNode.parentNode) {
      prevParent = addedNode.parentNode
      context = getContext(prevParent)
    }
    onNodeAdded(addedNode, context)
  }
  addedNodes.clear()
}
