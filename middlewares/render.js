'use strict'

const symbols = require('../core').symbols

module.exports = function render (config) {
  config = validateAndCloneConfig(config)

  if (config.cache) {
    config.template = cacheTemplate(config.template)
  }

  return function renderMiddleware (elem, state, next) {
    if (!elem instanceof HTMLElement) {
      return next()
    }
    elem.$using('render')

    let template
    if (config.cache) {
      template = document.importNode(config.template, true)
    } else {
      template = cacheTemplate(config.template)
    }

    if (config.compose) {
      composeContentWithTemplate(elem, state, template)
    } else {
      clearContent(elem)
    }

    elem.appendChild(template)
    return next()
  }
}

function composeContentWithTemplate (elem, state, template) {
  let defaultSlot

  Array.prototype.forEach.call(template.querySelectorAll('slot'), (slot) => {
    slot[symbols.contextState] = state

    if (slot.hasAttribute('name') && slot.getAttribute('name') !== '') {
      const slotFillers = elem.querySelectorAll(`[slot=${slot.getAttribute('name')}]`)
      if (slotFillers.length) {
        clearContent(slot)
        Array.prototype.forEach.call(slotFillers, (slotFiller) => slot.appendChild(slotFiller))
      }
    } else {
      defaultSlot = slot
    }
  })

  if (defaultSlot) {
    clearContent(defaultSlot)
    Array.prototype.forEach.call(elem.children, (child) => defaultSlot.appendChild(child))
  } else {
    clearContent(elem)
  }
}

function cacheTemplate (template) {
  const cachedTemplate = document.createElement('template')
  cachedTemplate.innerHTML = template
  return cachedTemplate.content
}

function clearContent (elem) {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild)
  }
}

function validateAndCloneConfig (rawConfig) {
  const resultConfig = {}

  if (typeof rawConfig !== 'object') {
    throw new TypeError('config must be an object')
  }

  if (typeof rawConfig.template === 'string') {
    resultConfig.template = rawConfig.template
  } else {
    throw new TypeError('template config must be a string')
  }

  if (typeof rawConfig.cache === 'boolean') {
    resultConfig.cache = rawConfig.cache
  } else if (rawConfig.cache === undefined) {
    resultConfig.cache = true
  } else {
    throw new TypeError('cache config must be a boolean or undefined')
  }

  if (typeof rawConfig.compose === 'boolean') {
    resultConfig.compose = rawConfig.compose
  } else if (rawConfig.compose === undefined) {
    resultConfig.compose = true
  } else {
    throw new TypeError('compose config must be a boolean or undefined')
  }

  return resultConfig
}
