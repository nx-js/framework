'use strict'

const timer = Symbol('debounce timer')

module.exports = function debounce (next, context, delay) {
  if (delay === undefined || isNaN(delay)) {
    delay = 200
  }
  clearTimeout(context[timer])
  context[timer] = setTimeout(next, delay)
}
