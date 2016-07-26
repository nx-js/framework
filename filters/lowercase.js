'use strict'

module.exports = function lowercase (value) {
  if (value === undefined) {
    return value
  }
  return String(value).toLowerCase()
}
