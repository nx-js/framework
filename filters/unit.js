'use strict'

module.exports = function unit (value, unitName, postfix) {
  unitName = unitName || 'item'
  postfix = postfix || 's'
  if (isNaN(value)) {
    return value + ' ' + unitName
  }
  const shouldPostFix = (value !== 0) && (1 < Math.abs(value))
  return value + ' ' + unitName + (shouldPostFix ? postfix : '')
}
