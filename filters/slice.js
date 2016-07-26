'use strict'

module.exports = function slice (value, begin, end) {
  if (value === undefined) {
    return value
  }
  return value.slice(begin, end)
}
