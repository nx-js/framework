'use strict'

const compiler = require('@risingstack/nx-compile')
const exposed = require('../core/symbols')

const limiterRegex = /(?:[^\&]|\&\&)+/g
const argsRegex = /\S+/g
const tokenCache = new Map()

function code (node, state) {
  node[exposed.limiters] = new Map()
  node.$compileCode = $compileCode
}
code.$name = 'code'
module.exports = code

function $compileCode (rawCode) {
  if (typeof rawCode !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  const code = parseCode(this, rawCode)
  const contextState = this[exposed.contextState]
  const context = {}

  return function evaluateCode (expando) {
    const backup = createBackup(contextState, expando)
    let i = 0
    function next () {
      try {
        Object.assign(contextState, expando)
        Object.assign(context, expando)
        if (i < code.limiters.length) {
          const limiter = code.limiters[i++]
          const args = limiter.argExpressions.map(evaluateArgExpression)
          limiter.effect(next, context, ...args)
        } else {
          code.exec()
        }
      } finally {
        Object.assign(contextState, backup)
        Object.assign(context, backup)
      }
    }
    next()
  }
}

function parseCode (node, rawCode) {
  let tokens = tokenCache.get(rawCode)
  if (!tokens) {
    tokens = rawCode.match(limiterRegex)
    tokenCache.set(rawCode, tokens)
  }
  const code = {
    exec: compiler.compileCode(tokens[0], node[exposed.contextState]),
    limiters: []
  }

  for (let i = 1; i < tokens.length; i++) {
    const limiterTokens = tokens[i].match(argsRegex) || []
    const limiterName = limiterTokens.shift()
    const effect = node[exposed.limiters].get(limiterName)
    if (!effect) {
      throw new Error(`there is no limiter named ${limiterName} on ${node}`)
    }
    code.limiters.push({effect, argExpressions: limiterTokens.map(compileArgExpression, node)})
  }
  return code
}

function evaluateArgExpression (argExpression) {
  return argExpression()
}

function compileArgExpression (argExpression) {
  return compiler.compileExpression(argExpression, this[exposed.contextState])
}

function createBackup (state, expando) {
  if (!expando) return undefined

  const backup = {}
  for (let key in expando) {
    backup[key] = state[key]
  }
  return backup
}
