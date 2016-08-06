'use strict'

module.exports = function keyLimiter (next, context, ...keys) {
  const key = context.$event.key
  if (!key || keys.indexOf(key) !== -1) {
    next()
  }
}
