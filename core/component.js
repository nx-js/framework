'use strict'

const validateConfig = require('./validateConfig')
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
let addedNodes = new Set()

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
  config.contentMiddlewares = config.contentMiddlewares || []
  config.contentMiddlewares.push(contentMiddleware)
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
  const config = this[secret.config]
  if (!this.$registered) {
    if (typeof config.state === 'object') {
      // later maybe check if it is observable??
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
    this.$registered = true

    if (config.root) {
      this.$root =  true
      this[secret.contentWatcher] = new MutationObserver(onMutations)
      this[secret.contentWatcher].observe(this, contentWatcherConfig)
      onNodeAdded(this, getContext(this.parentNode))
    } else {
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

  mutations = contentWatcher.takeRecords()
  if (mutations.length) {
    onMutations(mutations, contentWatcher)
  }
}
