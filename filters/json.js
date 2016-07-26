'use strict'

module.exports = function json (value, indent) {
  if (value === undefined) {
    return value
  }
  return JSON.stringify(value, null, indent)
}
