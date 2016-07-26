'use strict'

const wait = Symbol('throttle wait')

module.exports = function throttle (next, context, treshold) {
  if (treshold === undefined || isNaN(treshold)) {
    treshold = 200
  }
  if (!context[wait]) {
    next()
    context[wait] = true
    setTimeout(() => context[wait] = false, treshold)
  }
}
