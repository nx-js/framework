'use strict'

const setupNode = require('./setupNode')
const symbols = require('./symbols')

const attached = 'attached'
const detached = 'detached'

const contentWatcherConfig = {
  childList: true,
  subtree: true
}

module.exports = function onComponentAttached () {
  const context = getContext(this)

  if (!context.contentWatcherNode && context.isolate !== true) {
    this[symbols.contentWatcher] = new MutationObserver(onMutations)
    this[symbols.contentWatcher].observe(this, contentWatcherConfig)
    setTimeout(setupNodeAndChildren, 0, this, context.state, context.contentMiddlewares)
  }
}

function onMutations (mutations) {
  for (let mutation of mutations) {
    Array.prototype.forEach.call(mutation.removedNodes, cleanupNodeAndChildren)
    Array.prototype.forEach.call(mutation.addedNodes, onNodeAdded)
  }
}

function onNodeAdded (node) {
  const context = getContext(node)
  if (context.isolate !== true) {
    setupNodeAndChildren(node, context.state, context.contentMiddlewares)
  }
}

function setupNodeAndChildren (node, state, contentMiddlewares) {
  if (node[symbols.lifecycleStage] === detached) {
    throw new Error(`you cant reattach a detached node: ${node}`)
  }
  if (node[symbols.lifecycleStage] === attached || !node.parentNode) {
    return
  }
  if (node.parentNode[symbols.lifecycleStage] !== attached && !node[symbols.contentWatcher]) {
    return
  }
  node[symbols.lifecycleStage] = attached

  setupNode(node)

  if (node[symbols.contextState]) {
    state = node[symbols.contextState]
  }
  const contextState = state

  if (node[symbols.state]) {
    node[symbols.state].$parent = state
    if (node[symbols.inheritState]) {
      Object.setPrototypeOf(node[symbols.state], state)
    }
    state = node[symbols.state]
  }

  composeAndRunMiddlewares(node, state, contextState, contentMiddlewares, node[symbols.middlewares])
    .then(() => setupChildren(node, state, contentMiddlewares))
}

function composeAndRunMiddlewares (node, state, contextState, contentMiddlewares, middlewares) {
  return new Promise((resolve) => {
    let i = 0
    let j = 0

    function next () {
      if (i < contentMiddlewares.length) {
        contentMiddlewares[i++](node, contextState, next)
      } else if (middlewares && j < middlewares.length) {
        middlewares[j++](node, state, next)
      } else {
        resolve()
      }
    }
    next()
  })
}

function setupChildren (node, state, contentMiddlewares) {
  if (node[symbols.isolate] === true) {
    return
  } else if (node[symbols.isolateMiddlewares] === 'middlewares') {
    contentMiddlewares = node[symbols.contentMiddlewares].slice()
  } else if (node[symbols.contentMiddlewares]) {
    contentMiddlewares = contentMiddlewares.concat(node[symbols.contentMiddlewares])
  }

  Array.prototype.forEach.call(node.childNodes, (childNode) => {
    setupNodeAndChildren(childNode, state, contentMiddlewares)
  })
}

function cleanupNodeAndChildren (node) {
  if (node[symbols.lifecycleStage] !== detached) {
    return
  }
  if (node.parentNode && node.parentNode[symbols.lifecycleStage] === attached) {
    return
  }
  node[symbols.lifecycleStage] = detached

  if (node[symbols.contentWatcher]) {
    node[symbols.contentWatcher].disconnect()
  }
  if (node[symbols.cleanupFunctions]) {
    node[symbols.cleanupFunctions].forEach(runCleanupFunction)
  }
  Array.prototype.forEach.call(node.childNodes, cleanupNodeAndChildren)
}

function runCleanupFunction (cleanupFunction) {
  cleanupFunction()
}

function getContext (node) {
  const context = {contentMiddlewares: []}
  let isolate = false

  node = node.parentNode
  while (node) {
    if (!context.state && node[symbols.state]) {
      context.state = node[symbols.state]
    }
    if (!context.state && node[symbols.contextState]) {
      context.state = node[symbols.contextState]
    }

    if (isolate !== true && isolate !== 'middlewares') {
      isolate = node[symbols.isolate]
    } else if (isolate === true) {
      context.isolate = true
      return context
    }

    if (node[symbols.contentMiddlewares] && !isolate) {
      context.contentMiddlewares.push(...node[symbols.contentMiddlewares])
    }
    if (node[symbols.contentWatcher]) {
      context.contentWatcherNode = node
    }
    node = node.parentNode
  }
  return context
}
