'use strict'

module.exports = function interpolate (node, state, next) {
  if (node.nodeType !== Node.TEXT_NODE) return
  node.$require('expression')
  node.$using('interpolate')
  next()
  interpolateValue(node, state)
}

function interpolateValue (node, state) {
  const tokens = parseValue(node.nodeValue)

  for (let i = tokens.length; i--;) {
    const token = tokens[i]
    if (typeof token === 'object') {
      const expression = node.$compileExpression(token.expression)
      if (token.observed) {
        node.$observe(() => interpolateToken(token, expression(), tokens, node))
      } else {
        interpolateToken(token, expression(), tokens, node)
      }
    }
  }
}

function interpolateToken (token, value, tokens, node) {
  if (value === undefined) value = ''
  if (token.value !== value) {
    token.value = value
    node.nodeValue = tokens.map(tokenToString).join('')
  }
}

function tokenToString (token) {
  return (typeof token === 'object') ? token.value : token
}

function parseValue (string) {
  const tokens = []
  let expression = false
  let anchor = 0
  let depth = 0
  let char
  let token

  for (let i = 0; i < string.length; i++) {
    char = string.charAt(i)

    if (expression) {
      if (char === '{') {
        depth++
      } else if (char === '}') {
        depth--
      }

      if (depth === 0) {
        token.expression = string.slice(anchor, i)
        tokens.push(token)
        anchor = i + 1
        expression = false
      }
    } else {
      if (i === string.length - 1) {
        tokens.push(string.slice(anchor, i + 1))
      } else if ((char === '$' || char === '@') && string.charAt(i + 1) === '{') {
        tokens.push(string.slice(anchor, i))
        token = {observed: (char === '@')}
        anchor = i + 2
        depth = 0
        expression = true
      }
    }
  }
  return tokens
}
