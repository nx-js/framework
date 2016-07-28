'use strict'

const compiler = require('@risingstack/nx-compile')
const exposed = require('../core/symbols')

const filterRegex = /(?:[^\|]|\|\|)+/g
const argsRegex = /\S+/g

module.exports = function expression (node, state, next) {
  node.$using('expression')

  node.$filter = $filter
  node.$compileExpression = $compileExpression
  return next()
}

function $filter (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  if (!this[exposed.filters]) {
    this[exposed.filters] = new Map()
  }
  this[exposed.filters].set(name, handler)
}

function $compileExpression (rawExpression) {
  if (typeof rawExpression !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  const expression = parseExpression(this, rawExpression)

  return function evaluateExpression (state) {
    let value = expression.exec(state)
    for (let filter of expression.filters) {
      const args = evaluateArgExpressions(filter.argExpressions, state)
      value = filter.effect(value, ...args)
    }
    return value
  }
}

function parseExpression (node, rawExpression) {
  const tokens = rawExpression.match(filterRegex)
  const expression = {
    exec: compiler.compileExpression(tokens.shift()),
    filters: []
  }

  for (let filterToken of tokens) {
    filterToken = filterToken.match(argsRegex) || []
    const filterName = filterToken.shift()
    if (!node[exposed.filters] || !node[exposed.filters].has(filterName)) {
      throw new Error(`there is no filter named ${filterName} on ${node}`)
    }
    const effect = node[exposed.filters].get(filterName)
    const argExpressions = filterToken.map(compileArg)
    expression.filters.push({effect, argExpressions})
  }
  return expression
}

function evaluateArgExpressions (argExpressions, state) {
  const args = []
  for (let argExpression of argExpressions) {
    args.push(argExpression(state))
  }
  return args
}

function compileArg (arg) {
  return compiler.compileExpression(arg)
}
