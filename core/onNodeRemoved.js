'use strict'

const symbols = require('./symbols')

module.exports = function onNodeRemoved (node) {
  if (!shouldProcess(node)) return
  node[symbols.lifecycleStage] = 'detached'

  const cleanupFunctions = node[symbols.cleanupFunctions]
  for (let cleanupFunction of cleanupFunctions) {
    cleanupFunction(node)
  }

  let child = node.firstChild
  while (child) {
    onNodeRemoved(child)
    child = child.nextSibling
  }
}

function shouldProcess (node) {
  const parent = node.parentNode
  return (node[symbols.lifecycleStage] === 'attached' && (!parent || parent[symbols.lifecycleStage] === 'detached'))
}
