'use strict'

module.exports = function getContext (node) {
  const context = {contentMiddlewares: []}

  while (node) {
    if (!context.state && node.$state) {
      context.state = node.$state
    }
    if (!context.state && node.$contextState) {
      context.state = node.$contextState
    }
    if (!context.isolate) {
      context.isolate = node.$isolate
      if (node.$contentMiddlewares) {
        context.contentMiddlewares = node.$contentMiddlewares.concat(context.contentMiddlewares)
      }
    }
    if (node === node.$root) {
      context.root = context.root || node
      return context
    }
    if (node.host) {
      context.root = context.root || node
      node = node.host
    } else {
      node = node.parentNode
    }
  }
  return context
}
