'use strict'

module.exports = function date (value) {
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }
  return value
}
