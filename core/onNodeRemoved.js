'use strict'

const symbols = require('./symbols')

module.exports = function onNodeRemoved (node) {
  const parent = node.parentNode
  if (!parent || parent[symbols.lifecycleStage] === 'detached') {
    cleanupNodeAndChildren(node)
  }
}

function cleanupNodeAndChildren (node) {
  if (node[symbols.lifecycleStage] !== 'attached') return
  node[symbols.lifecycleStage] = 'detached'

  const cleanupFunctions = node[symbols.cleanupFunctions]
  if (cleanupFunctions) {
    for (let cleanupFunction of cleanupFunctions) {
      cleanupFunction(node)
    }
  }

  let child = node.firstChild
  while (child) {
    cleanupNodeAndChildren(child)
    child = child.nextSibling
  }
}
