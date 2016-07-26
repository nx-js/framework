'use strict'

module.exports = function uppercase (value) {
  if (value === undefined) {
    return value
  }
  return String(value).toUpperCase()
}
