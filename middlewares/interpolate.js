'use strict'

module.exports = function interpolate (node, state, next) {
  node.$require('evaluate')
  node.$using('interpolate')

  if (node.nodeType === Node.TEXT_NODE) {
    interpolateValue(node)
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    Array.prototype.forEach.call(node.attributes, (attribute) => interpolateValue(node, attribute))
  }
  return next()
}

function interpolateValue (node, attribute) {
  const tokens = attribute ? parseValue(attribute.value) : parseValue(node.nodeValue)

  for (let token of tokens) {
    if (typeof token === 'object') {
      if (!token.observed) {
        node.$eval(token.expression, (value) => interpolateToken(token, value, tokens, node, attribute))
      } else {
        node.$observedEval(token.expression, (value) => interpolateToken(token, value, tokens, node, attribute))
      }
    }
  }
}

function interpolateToken (token, value = '', tokens, node, attribute) {
  if (token.value !== value) {
    token.value = value
    if (attribute) {
      attribute.value = joinTokens(tokens, node, attribute)
    } else {
      node.nodeValue = joinTokens(tokens, node, attribute)
    }
  }
}

function joinTokens (tokens, node, attribute) {
  return tokens.map(tokenToString).join('')
}

function tokenToString (token) {
  if (typeof token === 'object') {
    return token.value
  } else {
    return token
  }
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
