'use strict'

const names = new Set()
const missing = new Set()
const duplicates = new Set()

module.exports = function validateMiddlewares (contentMiddlewares, middlewares, strict) {
  names.clear()
  missing.clear()
  duplicates.clear()

  if (contentMiddlewares) {
    contentMiddlewares.forEach(validateMiddleware)
  }
  if (middlewares) {
    middlewares.forEach(validateMiddleware)
  }
  if (missing.size) {
    if (!strict) return true
    throw new Error(`missing middlewares: ${Array.from(missing).join()}`)
  }
  if (duplicates.size) {
    if (!strict) return true
    throw new Error(`duplicate middlewares: ${Array.from(duplicates).join()}`)
  }
}

function validateMiddleware (middleware) {
  const name = middleware.$name
  const require = middleware.$require
  if (name) {
    if (names.has(name)) {
      duplicates.add(name)
    }
    names.add(name)
  }
  if (require) {
    for (let dependency of require) {
      if (!names.has(dependency)) {
        missing.add(dependency)
      }
    }
  }
}
