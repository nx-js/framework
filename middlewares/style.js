'use strict'

const secret = {
  display: Symbol('style display')
}

module.exports = function style (elem, state) {
  if (elem.nodeType !== 1) return
  elem.$require('attributes')
  elem.$using('style')

  elem.$attribute('class', classAttribute)
  elem.$attribute('style', styleAttribute)
}

function classAttribute (classes, elem) {
  if (typeof classes === 'object') {
    const classNames = Object.getOwnPropertyNames(classes)
    for (let i = classNames.length; i--;) {
      const className = classNames[i]
      if (classes[className]) {
        elem.classList.add(className)
      } else {
        elem.classList.remove(className)
      }
    }
  }
}

function styleAttribute (styles, elem) {
  if (typeof styles === 'object') {
    elem.style.cssText = ''
    Object.assign(elem.style, styles)
  }
}
