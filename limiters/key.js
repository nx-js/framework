'use strict'

const keycode = require('keycode')

module.exports = function keyLimiter (next, context, ...keys) {
  if (!(context.$event instanceof KeyboardEvent)) {
    return next()
  }

  const key = keycode(context.$event)
  if (keys.indexOf(key) !== -1) {
    next()
  }
}
