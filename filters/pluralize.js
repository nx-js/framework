'use strict'

module.exports = function pluralize (value, unit, postfix) {
  if (value === undefined) {
    return value
  }
  unit = unit || 'item'
  postfix = postfix || 's'
  return value + ' ' + unit + (1 < Math.abs(value) ? postfix : '')
}
