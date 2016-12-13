'use strict'

const validateConfig = require('./validateConfig')
const validateMiddlewares = require('./validateMiddlewares')
const getContext = require('./getContext')
const onNodeAdded = require('./onNodeAdded')
const onNodeRemoved = require('./onNodeRemoved')

const secret = {
  config: Symbol('component config')
}
const observerConfig = {
  childList: true,
  subtree: true
}
let context
let prevParent
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
    console.log('warning: content middlewares have no effect inside isolated components')
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
  if (config.root) {
    proto.detachedCallback = detachedCallback
  }
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
      const contentObserver = new MutationObserver(onMutations)
      contentObserver.observe(this, observerConfig)
    }

    if (addedNodes.size === 0) {
      Promise.resolve().then(processAddedNodes)
    }
    addedNodes.add(this)
  }
}

function detachedCallback () {
  onNodeRemoved(this)
}

function onMutations (mutations) {
  let mutationIndex = mutations.length
  while (mutationIndex--) {
    const mutation = mutations[mutationIndex]

    let nodes = mutation.removedNodes
    let nodeIndex = nodes.length
    while (nodeIndex--) {
      onNodeRemoved(nodes[nodeIndex])
    }

    nodes = mutation.addedNodes
    nodeIndex = nodes.length
    while (nodeIndex--) {
      addedNodes.add(nodes[nodeIndex])
    }
  }
  processAddedNodes()
}

function processAddedNodes () {
  addedNodes.forEach(processAddedNode)
  addedNodes.clear()
  context = prevParent = undefined
}

function processAddedNode (node) {
  const parentNode = node.parentNode || node.host
  if (prevParent !== parentNode) {
    prevParent = parentNode
    context = getContext(parentNode)
  }
  onNodeAdded(node, context)
  if (node.shadowRoot) {
    const shadowObserver = new MutationObserver(onMutations)
    shadowObserver.observe(node.shadowRoot, observerConfig)
  }
}
