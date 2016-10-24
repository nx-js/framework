'use strict'

const symbols = require('./symbols')

module.exports = function getContext (node) {
  const context = {contentMiddlewares: []}

  while (node) {
    if (!context.state && node[symbols.state]) {
      context.state = node[symbols.state]
    }
    if (!context.state && node[symbols.contextState]) {
      context.state = node[symbols.contextState]
    }
    if (node[symbols.contentMiddlewares] && !context.isolate) {
      context.contentMiddlewares = node[symbols.contentMiddlewares].concat(context.contentMiddlewares)
    }
    if (context.isolate !== true && context.isolate !== 'middlewares') {
      context.isolate = node[symbols.isolate]
    }
    if (node[symbols.root]) {
      return context
    }
    node = node.parentNode
  }
  return context
}
