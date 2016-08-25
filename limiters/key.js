'use strict'

module.exports = function keyLimiter (next, context, ...keys) {
  if (!(context.$event instanceof KeyboardEvent)) return next()

  const key = context.$event.key || context.$event.keyIdentifier
  if (!key || keys.indexOf(key) !== -1) {
    next()
  }
}
