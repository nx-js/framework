'use strict'

module.exports = function unit (value, unitName, postfix) {
  unitName = unitName || 'item'
  postfix = postfix || 's'
  if (isNaN(value)) {
    return value + ' ' + unitName
  }
  let result = value + ' ' + unitName
  if (value !== 1) result += postfix
  return result
}
