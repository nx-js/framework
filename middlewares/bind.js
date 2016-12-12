'use strict'

function bind (elem) {
  if (!elem.nodeType === 1) return

  if (isInput(elem)) {
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

function isInput (elem) {
  const tagName = elem.tagName
  return (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA')
}

function getType (elem) {
  if (elem.tagName === 'INPUT') {
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
