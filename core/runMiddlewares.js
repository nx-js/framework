'use strict'

let node
let index, middlewares, middlewaresLength
let contentIndex, contentMiddlewares, contentMiddlewaresLength

module.exports = function runMiddlewares (currNode, currContentMiddlewares, currMiddlewares) {
  node = currNode
  middlewares = currMiddlewares
  contentMiddlewares = currContentMiddlewares
  middlewaresLength = currMiddlewares ? currMiddlewares.length : 0
  contentMiddlewaresLength = currContentMiddlewares ? currContentMiddlewares.length : 0
  index = contentIndex = 0
  next()
}

function next () {
  if (contentIndex < contentMiddlewaresLength) {
    contentMiddlewares[contentIndex++].call(node, node, node.$state, next)
    next()
  } else if (index < middlewaresLength) {
    middlewares[index++].call(node, node, node.$state, next)
    next()
  }
}
