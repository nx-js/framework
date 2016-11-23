'use strict'

const compiler = require('@risingstack/nx-compile')

const limiterRegex = /(?:[^\&]|\&\&)+/g
const argsRegex = /\S+/g
const codeCache = new Map()
const limiters = new Map()

function code (node) {
  node.$compileCode = $compileCode
}
code.$name = 'code'
code.limiter = limiter
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

  if (typeof code === 'function') {
    return code
  }

  const context = {}
  return function evaluateCode (state, tempVars) {
    let i = 0
    function next () {
      Object.assign(context, tempVars)
      if (i < code.limiters.length) {
        const limiter = code.limiters[i++]
        const args = limiter.argExpressions.map(evaluateArgExpression, state)
        limiter.effect(next, context, ...args)
      } else {
        code.exec(state, tempVars)
      }
    }
    next()
  }
}

function parseCode (rawCode) {
  const tokens = rawCode.match(limiterRegex)
  if (tokens.length === 1) {
    return compiler.compileCode(tokens[0])
  }

  const code = {
    exec: compiler.compileCode(tokens[0]),
    limiters: []
  }
  for (let i = 1; i < tokens.length; i++) {
    const limiterTokens = tokens[i].match(argsRegex) || []
    const limiterName = limiterTokens.shift()
    const effect = limiters.get(limiterName)
    if (!effect) {
      throw new Error(`there is no limiter named ${limiterName}`)
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

function limiter (name, handler) {
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
