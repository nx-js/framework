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
    const classList = []
    const classNames = Object.getOwnPropertyNames(classes)
    for (let i = classNames.length; i--;) {
      const className = classNames[i]
      if (classes[className]) {
        classList.push(className)
      }
    }
    classes = classList.join(' ')
    elem.setAttribute('class', classes)
  }
}

function styleAttribute (styles, elem) {
  if (typeof styles === 'object') {
    const styleList = []
    const styleNames = Object.getOwnPropertyNames(styles)
    for (let i = styleNames.length; i--;) {
      const styleName = styleNames[i]
      styleList.push(`${styleName}: ${styles[styleName]};`)
    }
    styles = styleList.join(' ')
    elem.setAttribute('style', styles)
  }
}
