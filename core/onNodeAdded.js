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
  node.$type = node.nodeType
  if (!shouldProcess(node)) return
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
  runMiddlewares(node, contentMiddlewares, node.$middlewares)

  if (node.$type === 1 && node.$isolate !== true) {
    let child = node.firstChild
    while (child) {
      setupNodeAndChildren(child, node.$state, contentMiddlewares)
      child = child.nextSibling
    }
  }
}

function shouldProcess (node) {
  if (node.$lifecycleStage) {
    return false
  }
  if (node.$type === 1) {
    return ((!node.hasAttribute('is') && node.tagName.indexOf('-') === -1) || node.$registered)
  }
  if (node.$type === 3) {
    return node.nodeValue.trim()
  }
}
