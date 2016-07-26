'use strict'

const exposed = require('../core/symbols')
const paramsRegex = /\S+/g

document.addEventListener('input', onInput, true)
document.addEventListener('change', onInput, true)
document.addEventListener('submit', onSubmit, true)

function onInput (ev) {
  const params = ev.target[exposed.bindable]
  if (params && params.on === ev.type) {
    syncStateWithElement(ev.target)
  }
}

function onSubmit (ev) {
  syncStateWithForm(ev.target)
  ev.preventDefault()
}

module.exports = function bindable (elem, state, next) {
  if (!(elem instanceof Element)) {
    return next()
  }
  elem.$require('attributes')
  elem.$using('bindable')

  next()

  if (elem[exposed.bindable]) {
    elem.$attribute('bind', bindAttribute)
  }
}

function bindAttribute (params, name, elem, state) {
  if (typeof params === 'string') {
    const tokens = params.match(paramsRegex)
    params = {mode: tokens[0], on: tokens[1], type: tokens[2]}
  }
  params = Object.assign({}, elem[exposed.bindable], params)
  params.state = state
  elem[exposed.bindable] = params
  bindElement(elem)
}

function bindElement (elem) {
  const params = elem[exposed.bindable]

  if (params.mode === 'two-way') {
    elem.$observe(syncElementWithState)
    Promise.resolve().then(syncElementWithState)
  } else if (params.mode === 'one-time') {
    elem.$unobserve(syncElementWithState)
    Promise.resolve().then(syncElementWithState)
  } else if (params.mode === 'one-way') {
    elem.$unobserve(syncElementWithState)
  }

  function syncElementWithState () {
    const value = getValue(params.state, elem.name)
    if (elem.type === 'checkbox') {
      elem.checked = toType(value, 'boolean')
    } else if (elem.type === 'radio') {
      elem.checked = (value === toType(elem.value, params.type))
    } else {
      elem.value = toType(value)
    }
  }
}

function syncStateWithElement (elem) {
  const params = elem[exposed.bindable]
  if (elem.type === 'radio' || elem.type === 'checkbox') {
    const value = elem.checked ? toType(elem.value, params.type) : undefined
    setValue(params.state, elem.name, value)
  } else {
    setValue(params.state, elem.name, toType(elem.value, params.type))
  }
}

function syncStateWithForm (form) {
  Array.prototype.forEach.call(form.elements, syncStateWithFormControl)
}

function syncStateWithFormControl (elem) {
  const params = elem[exposed.bindable]
  if (params && params.on === 'submit') {
    syncStateWithElement(elem)
  }
}

function toType (value, type) {
  if (value === '') return undefined
  if (value === undefined) return ''
  if (type === 'string') return String(value)
  if (type === 'number') return Number(value)
  if (type === 'boolean') return Boolean(value)
  if (type === 'date') return new Date(value)
  return value
}

function getValue (state, name) {
  const tokens = name.split('.')
  let value = state

  for (let token of tokens) {
    value = value[token]
  }
  return value
}

function setValue (state, name, value) {
  const tokens = name.split('.')
  const propName = tokens.pop()
  let parent = state

  for (let token of tokens) {
    parent = parent[token]
  }
  parent[propName] = value
}
