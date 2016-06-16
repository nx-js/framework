'use strict'

const compiler = require('@risingstack/nx-compile')

const filters = Symbol('filters')
const expressions = Symbol('expressions')
const expressionParserRegex = /\|(?!\|)/

module.exports = {
  expression,
  filter
}

function expression (node, state, next) {
  node.$using('evaluate')

  node[filters] = new Map()
  node[expressions] = new Set()
  node.$eval = $eval
  node.$observedEval = $observedEval

  next()

  for (let expression of node[expressions]) {
    evaluateExpression(node, state, expression)
  }
}

function $eval (rawExpression, handler) {
  if (typeof rawExpression !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  this[expressions].add({rawExpression, handler, appliedFilters: [], observed: false})
}

function $observedEval (rawExpression, handler) {
  if (typeof rawExpression !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }
  this[expressions].add({rawExpression, handler, appliedFilters: [], observed: true})
}

function evaluateExpression (node, state, expression) {
  parseExpression(node, expression, node[filters])

  if (!expression.observed) {
    expression.handler(applyFilters(expression.appliedFilters, expression.exec(state)))
  } else {
    node.$observe(() => expression.handler(applyFilters(expression.appliedFilters, expression.exec(state))))
  }
}

function parseExpression (node, expression, availableFilters) {
  const tokens = expression.rawExpression.split(expressionParserRegex)
  expression.exec = compiler.compileExpression(tokens.shift())

  for (let filterText of tokens) {
    filterText = filterText.split(':')
    const filterName = filterText.shift().trim()
    if (!availableFilters.has(filterName)) {
      throw new Error(`there is no filter named ${filterName} on ${node}`)
    }
    expression.appliedFilters.push({effect: availableFilters.get(filterName), args: filterText})
  }
}

function filter (name, handler) {
  if (typeof name !== 'string') {
    throw new TypeError('first argument must be a string')
  }
  if (typeof handler !== 'function') {
    throw new TypeError('second argument must be a function')
  }

  return function filterMiddleware (node, state, next) {
    node.$require('evaluate')
    if (!node.$isUsing('evaluate-filter')) node.$using('evaluate-filter')

    if (node[filters].has(name)) {
      throw new Error(`a filter named ${name} already exists on ${node}`)
    }
    node[filters].set(name, handler)
    return next()
  }
}

function applyFilters (appliedFilters, value) {
  for (let filter of appliedFilters) {
    value = filter.effect(value, ...filter.args)
  }
  return value
}
