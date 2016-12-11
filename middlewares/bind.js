'use strict'

function bind (elem) {
  if (elem.nodeType === 1 && elem.name) {
    elem.$bindable({
      mode: 'two-way',
      on: elem.form ? 'submit' : 'change',
      type: getType(elem)
    })
  }
}
bind.$name = 'bind'
bind.$require = ['bindable']
module.exports = bind

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
