'use strict'

module.exports = function style (elem, state) {
  if (elem.nodeType !== 1) return
  elem.$require('attributes')
  elem.$using('style')

  elem.$attribute('class', classAttribute)
  elem.$attribute('style', styleAttribute)
}

function classAttribute (classes, elem) {
  if (typeof classes === 'object') {
    for (let className in classes) {
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
    Object.assign(elem.style, styles)
  }
}
