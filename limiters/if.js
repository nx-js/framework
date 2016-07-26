'use strict'

module.exports = function ifLimiter (next, context, condition) {
  if (condition) {
    next()
  }
}
