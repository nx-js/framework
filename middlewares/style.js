'use strict'

const secret = {
  display: Symbol('style display')
}

module.exports = function style (elem, state, next) {
  if (!(elem instanceof HTMLElement)) {
    return next()
  }
  elem.$require('attributes')
  elem.$using('style')

  elem.$attribute('class', classAttribute)
  elem.$attribute('style', styleAttribute)
  elem.$attribute('show', showAttribute)

  return next()
}

function classAttribute (classes, name, elem) {
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

// this is not yet working!
function styleAttribute (styles, name, elem) {
  let styleString
  if (typeof styles === 'object') {
    styleString = ''
    for (let key in styles) {
      styleString += `${key}: ${styles[key]}; `
    }
  } else {
    styleString = styles
  }
  elem.setAttribute('style', styleString)
}

// this is not yet working!
function showAttribute (show, name, elem) {
  if (show) {
    elem.style.display = elem[secret.display]
  } else {
    elem[secret.display] = elem.style.display
    elem.style.display = 'none'
  }
}
