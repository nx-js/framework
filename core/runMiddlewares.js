'use strict'

let node
let index, middlewares, middlewaresLength
let contentIndex, contentMiddlewares, contentMiddlewaresLength
let shouldValidate
const middlewareNames =  new Set()

module.exports = function runMiddlewares (currNode, currContentMiddlewares, currMiddlewares) {
  node = currNode
  shouldValidate = ((middlewares !== currMiddlewares) || (contentMiddlewares !== currContentMiddlewares))
  middlewares = currMiddlewares
  contentMiddlewares = currContentMiddlewares
  middlewaresLength = currMiddlewares ? currMiddlewares.length : 0
  contentMiddlewaresLength = currContentMiddlewares ? currContentMiddlewares.length : 0
  index = contentIndex = 0

  if (shouldValidate) {
    middlewareNames.clear()
  }
  next()
}

function next () {
  if (contentIndex < contentMiddlewaresLength) {
    const contentMiddleware = contentMiddlewares[contentIndex++]
    if (shouldValidate) {
      validateMiddleware(contentMiddleware)
    }
    contentMiddleware(node, node.$state, next)
    next()
  } else if (index < middlewaresLength) {
    const middleware = middlewares[index++]
    if (shouldValidate) {
      validateMiddleware(middleware)
    }
    middleware(node, node.$state, next)
    next()
  }
}

function validateMiddleware (middleware) {
  const name = middleware.$name
  const require = middleware.$require
  if (name) {
    if (middlewareNames.has(name)) {
      throw new Error(`duplicate middleware: ${name}`)
    }
    middlewareNames.add(name)
  }
  if (require) {
    for (let dependency of require) {
      if (!middlewareNames.has(dependency)) {
        throw new Error(`missing middleware: ${dependency}`)
      }
    }
  }
}
