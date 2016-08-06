'use strict'

const timer = Symbol('throttle timer')
const lastExecution = Symbol('throttle last execution')

module.exports = function throttle (next, context, threshold) {
  if (threshold === undefined || isNaN(threshold)) {
    threshold = 200
  }
  const last = context[lastExecution]
  if (last && Date.now() < (last + threshold)) {
    clearTimeout(context[timer])
    context[timer] = setTimeout(execute, context, next, threshold)
  } else {
    execute(context, next)
  }
}

function execute (context, next) {
  context[lastExecution] = Date.now()
  next()
}
