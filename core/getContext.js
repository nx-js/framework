'use strict'

const symbols = require('./symbols')

module.exports = function getContext (node) {
  const context = {contentMiddlewares: []}
  let isolate = false

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
      context.contentMiddlewares = node[symbols.contentMiddlewares].concat(context.contentMiddlewares)
    }
    if (node[symbols.root]) {
      return context
    }
    node = node.parentNode
  }
  return context
}
