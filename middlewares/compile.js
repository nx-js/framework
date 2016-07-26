'use strict'

const compiler = require('@risingstack/nx-compile')
const exposed = require('../core/symbols')

const filterRegex = /(?:[^\|]|\|\|)+/g
const limiterRegex = /(?:[^\&]|\&\&)+/g
const argsRegex = /\S+/g

module.exports = function compile (node, state, next) {
  node.$using('compile')

  node.$compileExpression = $compileExpression
  node.$compileCode = $compileCode
  return next()
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

function $compileCode (rawCode) {
  if (typeof rawCode !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  const code = parseCode(this, rawCode)
  const context = {}

  return function evaluateCode (state) {
    let i = 0
    function next () {
      if (i < code.limiters.length) {
        const limiter = code.limiters[i]
        const args = evaluateArgExpressions(limiter.argExpressions, state)
        limiter.effect(next, context, ...args)
      } else {
        code.exec(state)
      }
    }
    next()
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

function parseCode (node, rawCode) {
  const tokens = rawCode.match(limiterRegex)
  const code = {
    exec: compiler.compileCode(tokens.shift()),
    limiters: []
  }

  for (let limiterToken of tokens) {
    limiterToken = limiterToken.match(argsRegex) || []
    const limiterName = limiterToken.shift()
    if (!node[exposed.limiters] || !node[exposed.limiters].has(limiterName)) {
      throw new Error(`there is no limiter named ${limiterName} on ${node}`)
    }
    const effect = node[exposed.limiters].get(limiterName)
    const argExpressions = limiterToken.map(compileArg)
    code.limiters.push({effect, argExpressions})
  }
  return code
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
