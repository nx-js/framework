'use strict'

const validateMiddlewares = require('./validateMiddlewares')
const runMiddlewares = require('./runMiddlewares')

module.exports = function onNodeAdded (node, context) {
  const parent = node.parentNode
  const validParent = (parent && parent.$lifecycleStage === 'attached')
  if (validParent && node.$root) {
    throw new Error(`Nested root component: ${node.tagName}`)
  }
  if ((validParent || node.$root) && context.isolate !== true) {
    setupNodeAndChildren(node, context.state, context.contentMiddlewares)
  }
}

function setupNodeAndChildren (node, state, contentMiddlewares) {
  const type = node.nodeType
  if (!shouldProcess(node, type)) return
  node.$lifecycleStage = 'attached'

  node.$contextState = node.$contextState || state || node.$state
  node.$state = node.$state || node.$contextState
  if (node.$inheritState) {
    Object.setPrototypeOf(node.$state, node.$contextState)
  }

  if (node.$isolate === 'middlewares') {
    contentMiddlewares = node.$contentMiddlewares || []
  } else if (node.$contentMiddlewares) {
    contentMiddlewares = contentMiddlewares.concat(node.$contentMiddlewares)
  }
  if (node.$shouldValidate) {
    validateMiddlewares(contentMiddlewares, node.$middlewares, true)
  }
  node.$cleanup = $cleanup

  runMiddlewares(node, contentMiddlewares, node.$middlewares)

  if (type === 1 && node.$isolate !== true) {
    let child = node.firstChild
    while (child) {
      setupNodeAndChildren(child, node.$state, contentMiddlewares)
      child = child.nextSibling
    }

    child = node.shadowRoot ? node.shadowRoot.firstChild : undefined
    while (child) {
      setupNodeAndChildren(child, node.$state, contentMiddlewares)
      child = child.nextSibling
    }
  }
}

function shouldProcess (node, type) {
  if (node.$lifecycleStage) {
    return false
  }
  if (type === 1) {
    return ((!node.hasAttribute('is') && node.tagName.indexOf('-') === -1) || node.$registered)
  }
  if (type === 3) {
    return node.nodeValue.trim()
  }
}

function $cleanup (fn, ...args) {
  if (typeof fn !== 'function') {
    throw new TypeError('first argument must be a function')
  }
  this.$cleaners = this.$cleaners || []
  this.$cleaners.push({fn, args})
}
