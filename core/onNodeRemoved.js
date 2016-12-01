'use strict'

module.exports = function onNodeRemoved (node) {
  const parent = node.parentNode
  if (!parent || parent.$lifecycleStage === 'detached') {
    cleanupNodeAndChildren(node)
  }
}

function cleanupNodeAndChildren (node) {
  if (node.$lifecycleStage !== 'attached') return
  node.$lifecycleStage = 'detached'

  if (node.$cleaners) {
    node.$cleaners.forEach(runCleaner, node)
    node.$cleaners = undefined
  }

  let child = node.firstChild
  while (child) {
    cleanupNodeAndChildren(child)
    child = child.nextSibling
  }

  child = node.shadowRoot ? node.shadowRoot.firstChild : undefined
  while (child) {
    cleanupNodeAndChildren(child, node.$state, contentMiddlewares)
    child = child.nextSibling
  }
}

function runCleaner (cleaner) {
  cleaner.fn.apply(this, cleaner.args)
}
