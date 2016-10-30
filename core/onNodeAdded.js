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

function setupNodeAndChildren (node, state, contentMiddlewares, contentMiddlewareNames) {
  if (!shouldProcess(node)) return

  node[symbols.lifecycleStage] = 'attached'
  setupNode(node)

  if (node[symbols.contextState]) {
    state = node[symbols.contextState]
  } else {
    node[symbols.contextState] = state
  }

  if (node[symbols.state]) {
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
  if (node[symbols.contentMiddlewares] || node[symbols.middlewares]) {
    validateMiddlewares(contentMiddlewares.concat(node[symbols.middlewares] || []))
  }
  composeAndRunMiddlewares(node, state, contentMiddlewares, node[symbols.middlewares])

  let child = node.firstChild
  while (child) {
    setupNodeAndChildren(child, state, contentMiddlewares)
    child = child.nextSibling
  }
}

function composeAndRunMiddlewares (node, state, contentMiddlewares, middlewares) {
  const contentMiddlewaresLength = contentMiddlewares.length
  const middlewaresLength = middlewares ? middlewares.length : 0
  let i = 0
  let j = 0;

  (function next () {
    if (i < contentMiddlewaresLength) {
      contentMiddlewares[i++](node, state, next)
      next()
    } else if (j < middlewaresLength) {
      middlewares[j++](node, state, next)
      next()
    }
  })()
}

function validateMiddlewares (middlewares) {
  const middlewareNames = new Set()
  let duplicates
  let missing

  for (let middleware of middlewares) {
    const name = middleware.$name
    const require = middleware.$require
    if (name) {
      if (middlewareNames.has(name)) {
        duplicates = duplicates || new Set()
        duplicates.add(name)
      }
      middlewareNames.add(name)
    }
    if (require) {
      for (let dependency of require) {
        if (!middlewareNames.has(dependency)) {
          missing = missing || new Set()
          missing.add(dependency)
        }
      }
    }
  }
  if (duplicates) {
    throw new Error(`duplicate middlewares: ${Array.from(duplicates).join(', ')}`)
  }
  if (missing) {
    throw new Error(`missing middlewares: ${Array.from(missing).join(', ')}`)
  }
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
