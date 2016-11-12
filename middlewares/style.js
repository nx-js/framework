'use strict'

function style (elem) {
  if (elem.nodeType !== 1) return

  elem.$attribute('class', classAttribute)
  elem.$attribute('style', styleAttribute)
}
style.$name = 'style'
style.$require = ['attributes']
module.exports = style

function classAttribute (classes, elem) {
  if (typeof classes === 'object') {
    for (let item in classes) {
      if (classes[item]) {
        elem.classList.add(item)
      } else if (elem.className) {
        elem.classList.remove(item)
      }
    }
  } else if (elem.className !== classes) {
    elem.className = classes
  }
}

function styleAttribute (styles, elem) {
  if (typeof styles === 'object') {
    Object.assign(elem.style, styles)
  } else if (elem.style.cssText !== styles) {
    elem.style.cssText = styles
  }
}
