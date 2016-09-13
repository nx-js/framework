'use strict'

const compiler = require('@risingstack/nx-compile')
const exposed = require('../core/symbols')
const secret = {
  state: Symbol('expression state')
}
const filterRegex = /(?:[^\|]|\|\|)+/g
const argsRegex = /\S+/g

module.exports = function expression (node, state, next) {
  node.$using('expression')

  node[secret.state] = state
  node.$compileExpression = $compileExpression
  return next()
}

function $compileExpression (rawExpression) {
  if (typeof rawExpression !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  const expression = parseExpression(this, rawExpression)

  return function evaluateExpression () {
    let value = expression.exec()
    for (let filter of expression.filters) {
      const args = filter.argExpressions.map(evaluateArgExpression)
      value = filter.effect(value, ...args)
    }
    return value
  }
}

function parseExpression (node, rawExpression) {
  const tokens = rawExpression.match(filterRegex)
  const expression = {
    exec: compiler.compileExpression(tokens.shift(), node[secret.state]),
    filters: []
  }

  for (let filterToken of tokens) {
    filterToken = filterToken.match(argsRegex) || []
    const filterName = filterToken.shift()
    if (!node[exposed.filters] || !node[exposed.filters].has(filterName)) {
      throw new Error(`there is no filter named ${filterName} on ${node}`)
    }
    const effect = node[exposed.filters].get(filterName)
    const argExpressions = filterToken.map(compileArgExpression, node)
    expression.filters.push({effect, argExpressions})
  }
  return expression
}

function evaluateArgExpression (argExpression) {
  return argExpression()
}

function compileArgExpression (argExpression) {
  return compiler.compileExpression(argExpression, this[secret.state])
}
