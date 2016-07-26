'use strict'

const exposed = require('../core/symbols')

module.exports = function bind (elem, state, next) {
  if (!isInput(elem)) {
    return next()
  }
  elem.$require('bindable')
  elem.$isUsing('bind')

  elem[exposed.bindable] = {mode: 'two-way', on: 'change', type: 'string'}

  return next()
}

function isInput (elem) {
  if (elem instanceof HTMLInputElement) return true
  if (elem instanceof HTMLTextAreaElement) return true
  if (elem instanceof HTMLSelectElement) return true
  return false
}
