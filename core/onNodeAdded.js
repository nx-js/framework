'use strict'

const setupNode = require('./setupNode')
const symbols = require('./symbols')

module.exports = function onNodeAdded (node, context) {
  const validParent = (node.parentNode && node.parentNode[symbols.lifecycleStage] === 'attached')
  if (validParent && node[symbols.root]) {
    throw new Error(`Nested root component: ${node.tagName}`)
  }
  if ((validParent || node[symbols.root]) && context.isolate !== true) {
    setupNodeAndChildren(node, context.state, context.contentMiddlewares)
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

  if (node[symbols.isolate] === 'middlewares') {
    contentMiddlewares = node[symbols.contentMiddlewares] || []
  } else if (node[symbols.contentMiddlewares]) {
    contentMiddlewares = contentMiddlewares.concat(node[symbols.contentMiddlewares])
  }
  composeAndRunMiddlewares(node, state, contentMiddlewares, node[symbols.middlewares])

  for (let i = node.childNodes.length; i--;) {
    setupNodeAndChildren(node.childNodes[i], state, contentMiddlewares)
  }
}

function composeAndRunMiddlewares (node, state, contentMiddlewares, middlewares) {
  let i = 0
  let j = 0;

  (function next () {
    if (i < contentMiddlewares.length) {
      contentMiddlewares[i++](node, state, next)
      next()
    } else if (middlewares && j < middlewares.length) {
      middlewares[j++](node, state, next)
      next()
    }
  })()
}

function shouldProcess (node) {
  if (node[symbols.lifecycleStage] || node[symbols.isolate] === true) {
    return false
  }
  if (node.nodeType === 1) {
    return ((!node.hasAttribute('is') && node.tagName.indexOf('-') === -1) || node[symbols.registered])
  }
  if (node.nodeType === 3) {
    return node.textContent.trim()
  }
}
