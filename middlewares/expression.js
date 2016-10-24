'use strict'

const compiler = require('@risingstack/nx-compile')
const exposed = require('../core/symbols')

const filterRegex = /(?:[^\|]|\|\|)+/g
const argsRegex = /\S+/g

module.exports = function expression (node, state) {
  node.$using('expression')
  node.$compileExpression = $compileExpression
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
    exec: compiler.compileExpression(tokens.shift(), node[exposed.contextState]),
    filters: []
  }

  for (let i = tokens.length; i--;) {
    const filterToken = tokens[i].match(argsRegex) || []
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
  return compiler.compileExpression(argExpression, this[exposed.contextState])
}
