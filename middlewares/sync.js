'use strict'

const SYNC_WITH_STATE = Symbol('SYNC WITH STATE')
const SYNC_ON = Symbol('SYNC ON')
const SYNC_MODE = Symbol('SYNC MODE')

module.exports = function sync (elem, state, next) {
  if (elem instanceof HTMLOptionElement) syncOption(elem, state)
  if (!(elem instanceof HTMLInputElement || elem instanceof HTMLSelectElement || elem instanceof HTMLTextAreaElement)) return next()
  elem.$require('attributes')
  elem.$using('sync')

  elem[SYNC_WITH_STATE] = state
  elem[SYNC_MODE] = elem.getAttribute('sync-mode') || 'two-way'
  elem[SYNC_ON] = elem.getAttribute('sync-on')
  if (!elem[SYNC_ON]) {
    if (elem.form) elem[SYNC_ON] = 'submit'
    else elem[SYNC_ON] = 'change'
  }

  setupListener(elem)
  setupObserver(elem)

  return next()
}

function syncOption (option, state) {
  option.$observe(() => {
    const select = option.parentNode // need a better implementation
    if (!select) return
    // I have to check if state[select.name] is an array or defined at all
    // for example if both are undefined I am funcked?
    if (select.type === 'select-one') {
      if (option.value === state[select.name]) option.selected = true
    } else if (select.type === 'select-multiple') {
      if (state[select.name].indexOf(option.value) !== -1) option.selected = true
    }
  })
}

function setupListener (elem) {
  const trigger = elem[SYNC_ON]
  if (trigger === 'input') elem.addEventListener('input', listener)
  else if (trigger === 'change') elem.addEventListener('change', listener)
  else if (trigger === 'submit' && elem.form) elem.form.addEventListener('submit', listener)
  else if (trigger !== 'non') throw new Error('invalid sync-on value')
}

function listener (ev) {
  const elem = ev.target
  const state = elem[SYNC_WITH_STATE]

  if (elem instanceof HTMLFormElement) {
    syncForm(elem, state)
    ev.preventDefault()
  } else syncFormControl(elem, state)
}

function syncForm (form, state) {
  Array.prototype.forEach.call(form.elements, processFormControl)
}

function processFormControl (elem) {
  if (elem[SYNC_ON] === 'submit' && elem[SYNC_WITH_STATE]) {
    syncFormControl(elem, elem[SYNC_WITH_STATE])
  }
}

function syncFormControl (elem, state) {
  if (elem.type === 'radio' || elem.type === 'checkbox') state[elem.name] = elem.checked
  else if (elem.type === 'select-multiple') {
    state[elem.name] = Array.prototype.map.call(elem.selectedOptions, optionToValue)
  }
  else if (elem.type === 'number' || elem.type === 'range') state[elem.name] = Number(elem.value)
  // else if (elem.type === 'date' || elem.type === 'datetime-local' || elem.type === 'month') state[elem.name] = new Date(elem.value).getTime()
  else state[elem.name] = (elem.value !== '') ? elem.value : undefined
}

function optionToValue (option) {
  return option.value
}

function setupObserver (elem) {
  const mode = elem[SYNC_MODE]
  if (mode === 'two-way') elem.$observe(() => observer(elem))
  else if (mode === 'one-time') observer(elem)
  else if (mode !== 'one-way') throw new Error('invalid sync-mode value')
}

// throw on error if its bad type in state!
function observer (elem) {
  const state = elem[SYNC_WITH_STATE]

  if ((elem.type === 'number' || elem.type === 'range') && state[elem.name] !== undefined && (typeof state[elem.name] !== 'number')) {
    throw new Error(`${elem.name} should be a number, instead it is ${typeof state[elem.name]}`)
  }
  if (elem.type === 'radio' || elem.type === 'checkbox' && state[elem.name] !== undefined && (typeof state[elem.name] !== 'boolean')) {
    throw new Error(`${elem.name} should be a boolean, instead it is ${typeof state[elem.name]}`)
  }

  if (elem.type === 'radio' || elem.typema === 'checkbox') elem.checked = state[elem.name]
  else if (elem.type === 'select-multiple') {
    for (let name of state[elem.name]) {
      // the others should be unselected! -> TODO -> iterate options and select/deselect
      elem.options[name].selected = true
    }
  } else {
    elem.value = (state[elem.name] !== undefined) ? state[elem.name] : ''
  }
}
