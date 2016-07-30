'use strict'

const secret = {
  state: Symbol('bindable state'),
  bindable: Symbol('bindable params')
}
const paramsRegex = /\S+/g
const defaultParams = {mode: 'two-way', on: 'change', type: 'string'}

document.addEventListener('input', onInput, true)
document.addEventListener('change', onInput, true)
document.addEventListener('submit', onSubmit, true)

function onInput (ev) {
  const params = ev.target[secret.bindable]
  if (params && params.on === ev.type) {
    syncStateWithElement(ev.target)
  }
}

function onSubmit (ev) {
  syncStateWithForm(ev.target)
  ev.preventDefault()
}

module.exports = function bindable (elem, state, next) {
  if (!(elem instanceof Element)) return next()
  elem.$require('attributes')
  elem.$using('bindable')

  elem.$bindable = $bindable
  next()

  if (elem[secret.bindable]) {
    elem[secret.state] = state
    elem.$attribute('bind', bindAttribute)
  }
}

function $bindable (params) {
  if (typeof params !== 'object') params = {}
  this[secret.bindable] = Object.assign({}, defaultParams, params)
}

function bindAttribute (params, elem) {
  if (typeof params === 'string') {
    const tokens = params.match(paramsRegex)
    params = {}
    if (tokens) {
      if (tokens[0]) params.mode = tokens[0]
      if (tokens[1]) params.on = tokens[1]
      if (tokens[2]) params.type = tokens[2]
    }
  }
  if (typeof params === 'object') {
    Object.assign(elem[secret.bindable], params)
  }
  bindElement(elem)
}

function bindElement (elem) {
  const params = elem[secret.bindable]
  if (params.mode === 'two-way') {
    elem.$observe(syncElementWithState)
    // not optimal, but resolve.then is not enough delay
    elem.$schedule(syncElementWithState)
  } else if (params.mode === 'one-time') {
    elem.$unobserve(syncElementWithState)
    // not optimal, but resolve.then is not enough delay
    elem.$schedule(syncElementWithState)
  } else if (params.mode === 'one-way') {
    elem.$unobserve(syncElementWithState)
  } else {
    throw new TypeError('bind mode must be two-way, one-time or one-way')
  }

  function syncElementWithState () {
    const state = elem[secret.state]
    const value = getValue(state, elem.name)
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
  const state = elem[secret.state]
  const params = elem[secret.bindable]
  if (elem.type === 'radio' || elem.type === 'checkbox') {
    const value = elem.checked ? toType(elem.value, params.type) : undefined
    setValue(state, elem.name, value)
  } else {
    setValue(state, elem.name, toType(elem.value, params.type))
  }
}

function syncStateWithForm (form) {
  Array.prototype.forEach.call(form.elements, syncStateWithFormControl)
}

function syncStateWithFormControl (elem) {
  const params = elem[secret.bindable]
  if (params && params.on === 'submit') {
    syncStateWithElement(elem)
  }
}

function toType (value, type) {
  if (value === '') return undefined
  if (value === undefined) return ''

  if (type === 'string') return String(value)
  else if (type === 'number') return Number(value)
  else if (type === 'boolean') return Boolean(value)
  else if (type === 'date') return new Date(value)
  else if (type !== undefined) {
    throw new TypeError('bind type must be string, number, boolean or date')
  }

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
