'use strict'

const compiler = require('@risingstack/nx-compile')

const filterRegex = /(?:[^\|]|\|\|)+/g
const argsRegex = /\S+/g
const expressionCache = new Map()
const filters = new Map()

nx.filter = function filter (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  if (filters.has(name)) {
    throw new Error(`a filter named ${name} is already registered`)
  }
  filters.set(name, handler)
  return this
}

function expression (node) {
  node.$compileExpression = $compileExpression
}
expression.$name = 'expression'
module.exports = expression

function $compileExpression (rawExpression) {
  if (typeof rawExpression !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  let expression = expressionCache.get(rawExpression)
  if (!expression) {
    expression = parseExpression(rawExpression)
    expressionCache.set(rawExpression, expression)
  }
  const contextState = compiler.sandbox(this.$contextState)

  return function evaluateExpression () {
    let value = expression.exec(contextState)
    for (let filter of expression.filters) {
      const args = filter.argExpressions.map(evaluateArgExpression, contextState)
      value = filter.effect(value, ...args)
    }
    return value
  }
}

function parseExpression (rawExpression) {
  const tokens = rawExpression.match(filterRegex)
  const expression = {
    exec: compiler.compileExpression(tokens[0]),
    filters: []
  }

  for (let i = 1; i < tokens.length; i++) {
    let filterTokens = tokens[i].match(argsRegex) || []
    const filterName = filterTokens.shift()
    const effect = filters.get(filterName)
    if (!effect) {
      throw new Error(`there is no filter named ${filterName}`)
    }
    expression.filters.push({effect, argExpressions: filterTokens.map(compileArgExpression)})
  }
  return expression
}

function evaluateArgExpression (argExpression) {
  return argExpression(this)
}

function compileArgExpression (argExpression) {
  return compiler.compileExpression(argExpression)
}
