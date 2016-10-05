'use strict'

const symbols = require('./symbols')

module.exports = function onNodeRemoved (node) {
  if (!shouldProcess(node)) return
  node[symbols.lifecycleStage] = 'detached'

  const cleanupFunctions = node[symbols.cleanupFunctions]
  if (cleanupFunctions) {
    for (let cleanupFunction of cleanupFunctions) {
      cleanupFunction(node)
    }
  }
  Array.prototype.forEach.call(node.childNodes, onNodeRemoved)
}

function shouldProcess (node) {
  const validStage = (node[symbols.lifecycleStage] === 'attached')
  const validParent = (!node.parentNode || node.parentNode[symbols.lifecycleStage] === 'detached')
  return (validStage && validParent)
}
