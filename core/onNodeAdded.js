'use strict'

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

function setupNodeAndChildren (node, state, contentMiddlewares, contentMiddlewareNames) {
  if (!shouldProcess(node)) return
  node.$lifecycleStage = 'attached'

  node.$contextState = node.$contextState || state
  node.$state = node.$state || node.$contextState

  if (node.$isolate === 'middlewares') {
    contentMiddlewares = node.$contentMiddlewares || []
  } else if (node.$contentMiddlewares) {
    contentMiddlewares = contentMiddlewares.concat(node.$contentMiddlewares)
  }
  if (node.$contentMiddlewares || node.$middlewares) {
    validateMiddlewares(contentMiddlewares.concat(node.$middlewares || []))
  }
  composeAndRunMiddlewares(node, contentMiddlewares, node.$middlewares)

  let child = node.firstChild
  while (child) {
    setupNodeAndChildren(child, node.$state, contentMiddlewares)
    child = child.nextSibling
  }
}

function composeAndRunMiddlewares (node, contentMiddlewares, middlewares) {
  const contentMiddlewaresLength = contentMiddlewares.length
  const middlewaresLength = middlewares ? middlewares.length : 0
  let i = 0
  let j = 0;

  (function next () {
    if (i < contentMiddlewaresLength) {
      contentMiddlewares[i++](node, node.$state, next)
      next()
    } else if (j < middlewaresLength) {
      middlewares[j++](node, node.$state, next)
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
  if (node.$lifecycleStage || node.$isolate === true) {
    return false
  }
  if (node.nodeType === 1) {
    return ((!node.hasAttribute('is') && node.tagName.indexOf('-') === -1) || node.$registered)
  }
  if (node.nodeType === 3) {
    return node.nodeValue.trim()
  }
}
