'use strict'

const secret = {
  display: Symbol('style display')
}

module.exports = function style (elem, state) {
  if (!(elem instanceof HTMLElement)) return
  elem.$require('attributes')
  elem.$using('style')

  elem.$attribute('class', classAttribute)
  elem.$attribute('style', styleAttribute)
}

function classAttribute (classes, elem) {
  if (typeof classes === 'object') {
    const classList = []
    for (let className in classes) {
      if (classes[className]) {
        classList.push(className)
      }
    }
    classes = classList.join(' ')
  }
  elem.setAttribute('class', classes)
}

function styleAttribute (styles, elem) {
  if (typeof styles === 'object') {
    const styleList = []
    for (let styleName in styles) {
      styleList.push(`${styleName}: ${styles[styleName]};`)
    }
    styles = styleList.join(' ')
  }
  elem.setAttribute('style', styles)
}
