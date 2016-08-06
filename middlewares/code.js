'use strict'

const compiler = require('@risingstack/nx-compile')
const exposed = require('../core/symbols')

const limiterRegex = /(?:[^\&]|\&\&)+/g
const argsRegex = /\S+/g

module.exports = function code (node, state, next) {
  node.$using('code')

  node.$compileCode = $compileCode
  return next()
}

function $compileCode (rawCode) {
  if (typeof rawCode !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  const code = parseCode(this, rawCode)
  const context = {}

  return function evaluateCode (state, expando) {
    const backup = createBackup(state, expando)
    let i = 0
    function next () {
      try {
        Object.assign(state, expando)
        Object.assign(context, expando)
        if (i < code.limiters.length) {
          const limiter = code.limiters[i++]
          const args = evaluateArgExpressions(limiter.argExpressions, state)
          limiter.effect(next, context, ...args)
        } else {
          code.exec(state)
        }
      } finally {
        Object.assign(state, backup)
        Object.assign(context, backup)
      }
    }
    next()
  }
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

function createBackup (state, expando) {
  if (!expando) return undefined

  const backup = {}
  for (let key in expando) {
    backup[key] = state[key]
  }
  return backup
}
