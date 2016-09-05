'use strict'

const stringToCode = require('keycode')

module.exports = function keyLimiter (next, context, ...keys) {
  if (!(context.$event instanceof KeyboardEvent)) {
    return next()
  }

  const keyCodes = keys.map(stringToCode)
  const keyCode = context.$event.keyCode || context.$event.which
  if (keyCodes.indexOf(keyCode) !== -1) {
    next()
  }
}
