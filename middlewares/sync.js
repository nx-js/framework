'use strict'

const syncWithState = Symbol('syncWithState')
const syncOn = Symbol('syncOn')
const syncMode = Symbol('syncMode')

const syncModes = ['none', 'setup', 'one-way', 'two-way']
const syncTriggers = ['input', 'change', 'submit']

document.addEventListener('input', onInput, true)
document.addEventListener('change', onChange, true)
document.addEventListener('submit', onSubmit, true)

function onInput (ev) {
  if (ev.target[syncMode] !== 'none' && ev.target[syncOn] === 'input') {
    syncStateWithInput(ev.target[syncWithState], ev.target)
  }
}

function onChange (ev) {
  if (ev.target[syncMode] !== 'none' && ev.target[syncOn] === 'change') {
    if (isInput(ev.target)) {
      syncStateWithInput(ev.target[syncWithState], ev.target)
    } else if (isSelect(ev.target)) {
      syncStateWithSelect(ev.target[syncWithState], ev.target)
    }
  }
}

function onSubmit (ev) {
  syncStateWithForm(ev.target)
  ev.preventDefault()
}

module.exports = function sync (elem, state, next) {
  if (!isInput(elem) && !isSelect(elem) && !isOption(elem)) return next()
  elem.$require('attributes')
  elem.$using('sync')

  if (isInput(elem) || isSelect(elem)) {
    elem[syncWithState] = state
    elem[syncMode] = elem.getAttribute('nx-sync-mode')
    if (!elem.name) {
      elem[syncMode] = 'none'
    }
    if (!elem[syncMode]) {
      elem[syncMode] = 'two-way'
    }
    elem[syncOn] = elem.getAttribute('nx-sync-on')
    if (!elem[syncOn]) {
      if (elem.form) elem[syncOn] = 'submit'
      else elem[syncOn] = 'change'
    }
    if (syncModes.indexOf(elem[syncMode]) === -1) {
      throw new Error(`sync-mode must be one of ${syncModes}, instead it is ${elem[syncMode]}`)
    }
    if (syncTriggers.indexOf(elem[syncOn]) === -1) {
      throw new Error(`sync-on must be one of ${syncTriggers}, instead it is ${elem[syncOn]}`)
    }
    if (elem[syncOn] === 'submit' && !elem.form) {
      throw new Error(`${elem} must have a parent form to sync on submit`)
    }
    if (elem[syncOn] === 'input' && !isInput(elem)) {
      throw new Error(`${elem} must be a text area or an input to sync on input events`)
    }
  }
  if (isInput(elem)) {
    syncInput(elem, state)
  } else if (isOption(elem)) {
    syncOption(elem, state)
  }

  return next()
}

function syncOption (option, state) {
  let select = option.parentNode
  if (!(select instanceof HTMLSelectElement)) {
    select = select.parentNode
  }
  if (!(select instanceof HTMLSelectElement)) {
    return
  }

  if (select[syncMode] === 'two-way') {
    option.$observe(() => syncSelectOptionWithState(select, option, state))
  } else if (select[syncMode] === 'setup') {
    syncSelectOptionWithState(select, option, state)
  }
}

function syncSelectOptionWithState (select, option, state) {
  const name = select.name
  const value = state[select.name]

  if (select.multiple) {
    if (isArray(name, value) && value.indexOf(option.value) !== -1) {
      option.selected = true
    } else {
      option.selected = false
    }
  } else {
    if (isType(name, value, 'string') && option.value === value) {
      option.selected = true
    } else {
      option.selected = false
    }
  }
}

function syncStateWithSelect (state, select) {
  if (select.multiple) {
    state[select.name] = Array.prototype.map.call(select.selectedOptions, optionToValue)
  } else {
    state[select.name] = select.value
  }
}

function optionToValue (option) {
  return option.value
}

function syncInput (input, state) {
  if (input[syncMode] === 'two-way') {
    input.$observe(() => syncInputWithState(input, state))
  } else if (input[syncMode] === 'setup') {
    syncInputWithState(input, state)
  } else if (input[syncMode] !== 'one-way' && input[syncMode] !== 'none') {
    throw new Error(`invalid sync-mode ${input[syncMode]}`)
  }
}

function syncInputWithState (input, state) {
  const name = input.name
  const value = state[input.name]

  if (input.type === 'number' || input.type === 'range') {
    if (isType(name, value, 'number')) {
      input.value = value
    } else {
      input.value = ''
    }
  } else if (input.type === 'checkbox') {
    if (isType(name, value, 'boolean')) {
      input.checked = value
    } else {
      input.checked = false
    }
  } else if (input.type === 'radio') {
    if (isType(name, value, 'string')) {
      input.checked = (input.value === value)
    } else {
      input.checked = false
    }
  } else {
    if (isType(name, value, 'string')) {
      input.value = value
    } else {
      input.value = ''
    }
  }
}

function syncStateWithInput (state, input) {
  if (input.type === 'number' || input.type === 'range') {
    if (input.value !== '') {
      state[input.name] = Number(input.value)
    } else {
      state[input.name] = undefined
    }
  } else if (input.type === 'checkbox') {
    state[input.name] = input.checked
  } else {
    if (input.value !== '') {
      state[input.name] = input.value
    } else {
      state[input.name] = undefined
    }
  }
}

function syncStateWithForm (form) {
  Array.prototype.forEach.call(form.elements, syncStateWithFormElement)
}

function syncStateWithFormElement (elem) {
  if (elem[syncMode] === 'none' || !elem[syncOn] === 'submit') {
    return
  }
  if (isInput(elem))  {
    syncStateWithInput(elem[syncWithState], elem)
  } else if (isSelect(elem)) {
    syncStateWithSelect(elem[syncWithState], elem)
  }
}

function isType (name, value, type) {
  if (value === undefined) {
    return false
  } else if ((typeof value) !== type) {
    throw new Error(`${name} should be a ${type}, instead it is ${typeof value}`)
  }
  return true
}

function isArray (name, value) {
  if (value === undefined) {
    return false
  } else if (!Array.isArray(value)) {
    throw new Error(`${name} should be an array`)
  }
  return true
}

function isInput (elem) {
  return (elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement)
}

function isSelect (elem) {
  return (elem instanceof HTMLSelectElement)
}

function isOption (elem) {
  return (elem instanceof HTMLOptionElement)
}
