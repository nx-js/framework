'use strict'

module.exports = function time (value) {
  if (value instanceof Date) {
    return value.toLocaleTimeString()
  }
  return value
}
