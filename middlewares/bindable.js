'use strict'

const secret = {
  bound: Symbol('bound element'),
  params: Symbol('bind params'),
  bindEvents: Symbol('bind events'),
  signal: Symbol('observing signal')
}
const paramsRegex = /\S+/g
const defaultParams = {mode: 'two-way', on: 'change', type: 'string'}

function onInput (ev) {
  const elem = ev.target
  const params = elem[secret.params]
  if (ev.type === 'submit') {
    syncStateWithForm(elem)
    ev.preventDefault()
  } else if (elem[secret.bound] && params.on.indexOf(ev.type) !== -1) {
    syncStateWithElement(elem)
  }
}

function bindable (elem, state, next) {
  if (elem.nodeType !== 1) return

  elem.$bindable = $bindable
  next()
  elem.$attribute('bind', bindAttribute)
}
bindable.$name = 'bindable'
bindable.$require = ['observe', 'attributes']
module.exports = bindable

function $bindable (params) {
  this[secret.params] = Object.assign({}, defaultParams, params)
}

function bindAttribute (newParams) {
  const params = this[secret.params]

  if (params) {
    if (newParams && typeof newParams === 'string') {
      const tokens = newParams.match(paramsRegex)
      params.mode = tokens[0] || params.mode,
      params.on = tokens[1] ? tokens[1].split(',') : params.on,
      params.type = tokens[2] || params.type
    } else if (newParams && typeof newParams === 'object') {
      Object.assign(params, newParams)
    }
    if (!Array.isArray(params.on)) {
      params.on = [params.on]
    }
    bindElement(this)
    this[secret.bound] = true
  }
}

function bindElement (elem) {
  const params = elem[secret.params]
  if (params.mode === 'two-way' && !elem[secret.signal]) {
    elem[secret.signal] = elem.$observe(syncElementWithState, elem)
    Promise.resolve().then(() => syncElementWithState(elem))
  } else if (params.mode === 'one-time') {
    elem.$unobserve(elem[secret.signal])
    Promise.resolve().then(() => syncElementWithState(elem))
    elem[secret.signal] = undefined
  } else if (params.mode === 'one-way') {
    elem.$unobserve(elem[secret.signal])
    elem[secret.signal] = undefined
  }

  const root = getRoot(elem)
  let bindEvents = root[secret.bindEvents]
  if (!bindEvents) {
    bindEvents = root[secret.bindEvents] = new Set()
  }
  for (let eventName of params.on) {
    if (!bindEvents.has(eventName)) {
      root.addEventListener(eventName, onInput, true)
      bindEvents.add(eventName)
    }
  }
}

function getRoot (elem) {
  while (elem.parentNode) {
    elem = elem.parentNode
    if (elem.$root) break
  }
  return elem
}

function syncElementWithState (elem) {
  const params = elem[secret.params]
  const value = getValue(elem.$state, elem.name)
  if (elem.type === 'radio' || elem.type === 'checkbox') {
    elem.checked = (value === toType(elem.value, params.type))
  } else if (elem.value !== toType(value)) {
    elem.value = toType(value)
  }
}

function syncStateWithElement (elem) {
  const params = elem[secret.params]
  if (elem.type === 'radio' || elem.type === 'checkbox') {
    const value = elem.checked ? toType(elem.value, params.type) : undefined
    setValue(elem.$state, elem.name, value)
  } else {
    setValue(elem.$state, elem.name, toType(elem.value, params.type))
  }
}

function syncStateWithForm (form) {
  Array.prototype.forEach.call(form.elements, syncStateWithFormControl)
}

function syncStateWithFormControl (elem) {
  if (elem[secret.bound]) {
    const params = elem[secret.params]
    if (params.on.indexOf('submit') !== -1) {
      syncStateWithElement(elem)
    }
  }
}

function toType (value, type) {
  if (value === '') return undefined
  if (value === undefined) return ''
  if (type === 'string') return String(value)
  else if (type === 'number') return Number(value)
  else if (type === 'boolean') return Boolean(value)
  else if (type === 'date') return new Date(value)
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
