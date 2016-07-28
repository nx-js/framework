'use strict'

module.exports = function unit (value, unitName, postfix) {
  unitName = unitName || 'item'
  postfix = postfix || 's'
  if (isNaN(value)) {
    return value + ' ' + unitName
  }
  return value + ' ' + unitName + (1 < Math.abs(value) ? postfix : '')
}
