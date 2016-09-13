'use strict'

module.exports = function bind (elem, state, next) {
  if (!isInput(elem)) return next()
  elem.$require('bindable')
  elem.$isUsing('bind')

  elem.$bindable({
    mode: 'two-way',
    on: getTrigger(elem),
    type: getType(elem)
  })

  return next()
}

function isInput (elem) {
  if (elem instanceof HTMLInputElement) return true
  if (elem instanceof HTMLTextAreaElement) return true
  if (elem instanceof HTMLSelectElement) return true
  return false
}

function getType (elem) {
  if (elem instanceof HTMLInputElement) {
    if (elem.type === 'checkbox') {
      return 'boolean'
    }
    if (elem.type === 'number' || elem.type === 'range' || elem.type === 'week') {
      return 'number'
    }
    if (elem.type === 'date' || elem.type === 'datetime') {
      return 'date'
    }
    if (elem.type === 'datetime-local' || elem.type === 'month') {
      return 'date'
    }
  }
  return 'string'
}

function getTrigger (elem) {
  if (elem.form && elem.form instanceof HTMLFormElement) {
    return 'submit'
  }
  return 'change'
}
