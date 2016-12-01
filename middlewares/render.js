'use strict'

let selectorScope

module.exports = function renderFactory (config) {
  config = validateAndCloneConfig(config)
  if (config.cache) {
    config.template = cacheTemplate(config.template)
  }

  function render (elem) {
    if (elem.nodeType !== 1) {
      throw new Error('render only works with element nodes')
    }

    let template
    if (config.cache) {
      template = document.importNode(config.template, true)
    } else {
      template = cacheTemplate(config.template)
    }
    composeContentWithTemplate(elem, template)
    elem.appendChild(template)

    if (config.style) {
      addScopedStyle(config.style, elem)
      config.style = undefined
    }
  }

  render.$name = 'render'
  return render
}

function composeContentWithTemplate (elem, template) {
  let defaultSlot
  const slots = template.querySelectorAll('slot')

  for (let i = slots.length; i--;) {
    const slot = slots[i]
    if (slot.getAttribute('name')) {
      const slotFillers = elem.querySelectorAll(`[slot=${slot.getAttribute('name')}]`)
      if (slotFillers.length) {
        slot.innerHTML = ''
        for (let i = slotFillers.length; i--;) {
          const slotFiller = slotFillers[i]
          slotFiller.$contextState = elem.$contextState
          slot.appendChild(slotFiller)
        }
      }
    } else if (slot.hasAttribute('name')) {
      defaultSlot = slot
    }
  }

  if (defaultSlot && elem.childNodes.length) {
    defaultSlot.innerHTML = ''
    while (elem.firstChild) {
      elem.firstChild[exposed.contextState] = elem[exposed.contextState]
      defaultSlot.appendChild(elem.firstChild)
    }
  }
  elem.innerHTML = ''
}

function addScopedStyle (styleString, elem) {
  const style = document.createElement('style')
  style.appendChild(document.createTextNode(styleString))

  if (style.scoped !== undefined) {
    style.scoped = true
    elem.appendChild(style)
  } else {
    document.documentElement.appendChild(style)
    setSelectorScope(elem)
    const rules = style.sheet.cssRules
    for (let i = rules.length; i--;) {
      const rule = rules[i]
      if (rule.type === 1) {
        rule.selectorText = rule.selectorText.split(',').map(scopeSelector).join(', ')
      }
    }
  }
}

function setSelectorScope (elem) {
  const is = elem.getAttribute('is')
  selectorScope = (is ? `${elem.tagName}[is="${is}"]` : elem.tagName).toLowerCase()
}

function scopeSelector (selector) {
  return `${selectorScope} ${selector.replace(':scope', '')}`
}

function cacheTemplate (template) {
  const cachedTemplate = document.createElement('template')
  cachedTemplate.innerHTML = template
  return cachedTemplate.content
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

  if (typeof rawConfig.style === 'string') {
    resultConfig.style = rawConfig.style
  } else if (rawConfig.style !== undefined) {
    throw new TypeError('template config must be a string or undefined')
  }

  if (typeof rawConfig.cache === 'boolean') {
    resultConfig.cache = rawConfig.cache
  } else if (rawConfig.cache === undefined) {
    resultConfig.cache = true
  } else {
    throw new TypeError('cache config must be a boolean or undefined')
  }

  return resultConfig
}
