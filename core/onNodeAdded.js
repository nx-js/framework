'use strict'

const setupNode = require('./setupNode')
const symbols = require('./symbols')

module.exports = function onNodeAdded (node) {
  const validParent = (node.parentNode && node.parentNode[symbols.lifecycleStage] === 'attached')
  if (validParent && node[symbols.root]) {
    throw new Error(`Nested root component: ${node.tagName}`)
  }
  if (validParent || node[symbols.root]) {
    setupNodeAndChildren(node, this.state, this.contentMiddlewares)
  }
}

function setupNodeAndChildren (node, state, contentMiddlewares) {
  if (!shouldProcess(node)) return

  node[symbols.lifecycleStage] = 'attached'
  setupNode(node)

  if (node[symbols.contextState]) {
    state = node[symbols.contextState]
  } else {
    node[symbols.contextState] = state
  }

  if (node[symbols.state]) {
    node[symbols.state].$parent = state
    if (node[symbols.inheritState]) {
      Object.setPrototypeOf(node[symbols.state], state)
    }
    state = node[symbols.state]
  } else {
    node[symbols.state] = state
  }

  composeAndRunMiddlewares(node, state, contentMiddlewares.concat(node[symbols.middlewares]))
  setupChildren(node, state, contentMiddlewares)
}

function composeAndRunMiddlewares (node, state, middlewares) {
  let i = 0
  function next () {
    const middleware = middlewares[i++]
    if (middleware) {
      middleware(node, state, next)
      next()
    }
  }
  next()
}

function setupChildren (node, state, contentMiddlewares) {
  if (node[symbols.isolate] === true) {
    return
  } else if (node[symbols.isolate] === 'middlewares') {
    contentMiddlewares = node[symbols.contentMiddlewares].slice()
  } else if (node[symbols.contentMiddlewares]) {
    contentMiddlewares = contentMiddlewares.concat(node[symbols.contentMiddlewares])
  }
  for (let i = 0; i < node.childNodes.length; i++) {
    setupNodeAndChildren(node.childNodes[i], state, contentMiddlewares)
  }
}

function shouldProcess (node) {
  if (node[symbols.lifecycleStage] !== undefined) {
    return false
  }
  if (node instanceof Element) {
    return (node[symbols.registered] || (node.tagName.indexOf('-') === -1 && !node.hasAttribute('is')))
  }
  if (node instanceof Text) {
    // TODO: remove textNode instead
    return Boolean(node.nodeValue.trim())
  }
}
