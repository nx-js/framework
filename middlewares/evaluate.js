'use strict'

const compiler = require('@risingstack/nx-compile')
const symbols = require('../core/symbols')

const expressions = Symbol('expressions')
const filterRegex = /(?:[^\|]|\|\|)+/g
const argsRegex = /\S+/g

module.exports = function evaluate (node, state, next) {
  node.$using('evaluate')

  node[expressions] = new Set()
  node.$evalExpression = $evalExpression

  next()

  for (let expression of node[expressions]) {
    evaluateAndHandleExpression(node, state, expression)
  }
}

function $evalExpression (rawExpression, handler, observed) {
  if (typeof rawExpression !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  this[expressions].add({rawExpression, handler, observed, filters: []})
}

function evaluateAndHandleExpression (node, state, expression) {
  parseExpression(node, expression)

  if (!expression.observed) {
    expression.handler(evaluateExpression(expression, state))
  } else {
    node.$observe(() => expression.handler(evaluateExpression(expression, state)))
  }
}

function evaluateExpression (expression, state) {
  let value = expression.exec(state)
  for (let filter of expression.filters) {
    const args = evaluateArgExpressions(filter.argExpressions, state)
    value = filter.effect(value, ...args)
  }
  return value
}

function evaluateArgExpressions (argExpressions, state) {
  const args = []
  for (let argExpression of argExpressions) {
    args.push(argExpression(state))
  }
  return args
}

function parseExpression (node, expression) {
  const tokens = expression.rawExpression.match(filterRegex)
  expression.exec = compiler.compileExpression(tokens.shift())

  for (let filterToken of tokens) {
    filterToken = filterToken.match(argsRegex) || []
    const filterName = filterToken.shift()
    if (!node[symbols.filters] || !node[symbols.filters].has(filterName)) {
      throw new Error(`there is no filter named ${filterName} on ${node}`)
    }
    const argExpressions = filterToken.map(compileArg)
    expression.filters.push({effect: node[symbols.filters].get(filterName), argExpressions: argExpressions})
  }
}

function compileArg (arg) {
  return compiler.compileExpression(arg)
}
