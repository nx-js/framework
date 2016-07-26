'use strict'

module.exports = function capitalize (value) {
  if (value === undefined) {
    return value
  }
  value = String(value)
  return value.charAt(0).toUpperCase() + value.slice(1)
}
