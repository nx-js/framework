'use strict'

const exposed = require('../core/symbols')
const secret = {
  params: Symbol('bindable params'),
  binder: Symbol('bindable binder')
}
const paramsRegex = /\S+/g
const defaultParams = {mode: 'two-way', on: 'change', type: 'string'}

document.addEventListener('submit', onSubmit, true)

function onInput (ev) {
  const params = ev.target[secret.params]
  if (ev.type === 'submit') {
    syncStateWithForm(ev.target)
  } else if (params && (params.on.indexOf(ev.type) !== -1)) {
    syncStateWithElement(ev.target)
  }
}

function onSubmit (ev) {
  ev.preventDefault()
}

function bindable (elem, state, next) {
  if (elem.nodeType !== 1) return

  elem.$bindable = $bindable
  next()

  if (elem[secret.params]) {
    elem[secret.binder] = syncElementWithState.bind(null, elem)
    elem.$attribute('bind', bindAttribute)
  }
}
bindable.$name = 'bindable'
bindable.$require = ['observe', 'attributes']
module.exports = bindable

function $bindable (params) {
  if (typeof params !== 'object') params = {}
  this[secret.params] = Object.assign({}, defaultParams, params)
}

function bindAttribute (params, elem) {
  if (typeof params === 'string') {
    const tokens = params.match(paramsRegex)
    params = {}
    if (tokens) {
      if (tokens[0]) params.mode = tokens[0]
      if (tokens[1]) params.on = tokens[1].split(',')
      if (tokens[2]) params.type = tokens[2]
    }
  }
  if (typeof params === 'object') {
    Object.assign(elem[secret.params], params)
  }
  if (!Array.isArray(elem[secret.params].on)) {
    elem[secret.params].on = [elem[secret.params].on]
  }
  bindElement(elem)
}

function bindElement (elem) {
  const params = elem[secret.params]
  const binder = elem[secret.binder]
  if (params.mode === 'two-way') {
    elem.$observe(binder)
    Promise.resolve().then(binder)
  } else if (params.mode === 'one-time') {
    elem.$unobserve(binder)
    Promise.resolve().then(binder)
  } else if (params.mode === 'one-way') {
    elem.$unobserve(binder)
  } else {
    throw new TypeError('bind mode must be two-way, one-time or one-way')
  }
  for (let eventName of params.on) {
    document.addEventListener(eventName, onInput, true)
  }
}

function syncElementWithState (elem) {
  const state = elem[exposed.state]
  const params = elem[secret.params]
  const value = getValue(state, elem.name)
  if (elem.type === 'radio' || elem.type === 'checkbox') {
    elem.checked = (value === toType(elem.value, params.type))
  } else if (elem.value !== toType(value)) {
    elem.value = toType(value)
  }
}

function syncStateWithElement (elem) {
  const state = elem[exposed.state]
  const params = elem[secret.params]
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
  const params = elem[secret.params]
  if (params && (params.on.indexOf('submit') !== -1)) {
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
