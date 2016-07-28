'use strict'

module.exports = function datetime (value) {
  if (value instanceof Date) {
    return value.toLocaleString()
  }
  return value
}
