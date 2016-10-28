'use strict'

const compiler = require('@risingstack/nx-compile')
const exposed = require('../core/symbols')

const limiterRegex = /(?:[^\&]|\&\&)+/g
const argsRegex = /\S+/g
const codeCache = new Map()
const limiters = new Map()

nx.limiter = function limiter (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  if (limiters.has(name)) {
    throw new Error(`a limiter named ${name} is already registered`)
  }
  limiters.set(name, handler)
  return this
}

function code (node) {
  node.$compileCode = $compileCode
}
code.$name = 'code'
module.exports = code

function $compileCode (rawCode) {
  if (typeof rawCode !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  let code = codeCache.get(rawCode)
  if (!code) {
    code = parseCode(rawCode)
    codeCache.set(rawCode, code)
  }
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
          const args = limiter.argExpressions.map(evaluateArgExpression, contextState)
          limiter.effect(next, context, ...args)
        } else {
          code.exec(contextState)
        }
      } finally {
        Object.assign(contextState, backup)
        Object.assign(context, backup)
      }
    }
    next()
  }
}

function parseCode (rawCode) {
  const tokens = rawCode.match(limiterRegex)
  const code = {
    exec: compiler.compileCode(tokens[0]),
    limiters: []
  }

  for (let i = 1; i < tokens.length; i++) {
    const limiterTokens = tokens[i].match(argsRegex) || []
    const limiterName = limiterTokens.shift()
    const effect = limiters.get(limiterName)
    if (!effect) {
      throw new Error(`there is no limiter named ${limiterName} on`)
    }
    code.limiters.push({effect, argExpressions: limiterTokens.map(compileArgExpression)})
  }
  return code
}

function evaluateArgExpression (argExpression) {
  return argExpression(this)
}

function compileArgExpression (argExpression) {
  return compiler.compileExpression(argExpression)
}

function createBackup (state, expando) {
  if (!expando) return undefined
  const backup = {}
  for (let key in expando) {
    backup[key] = state[key]
  }
  return backup
}
