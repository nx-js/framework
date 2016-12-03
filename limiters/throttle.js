'use strict'

const timer = Symbol('throttle timer')
const lastExecution = Symbol('throttle last execution')

module.exports = function throttle (next, context, threshold) {
  if (threshold === undefined || isNaN(threshold)) {
    threshold = 200
  }

  const last = context[lastExecution]
  const now = Date.now()
  if (!last || (last + threshold) < now) {
    context[lastExecution] = now
    next()
  }
}
