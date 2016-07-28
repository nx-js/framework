'use strict'

const secret = {
  hasIf: Symbol('flow hasIf'),
  showing: Symbol('flow showing'),
  hasRepeat: Symbol('flow hasRepeat'),
  prevArray: Symbol('flow prevArray')
}

module.exports = function flow (elem, state, next) {
  if (!(elem instanceof Element)) return next()
  elem.$require('content', 'attributes')
  elem.$using('flow')

  elem.$attribute('if', ifAttribute)
  elem.$attribute('repeat', repeatAttribute)

  return next()
}

function ifAttribute (show, elem) {
  if (elem[secret.hasRepeat]) {
    throw new Error('cant use if and repeat on the same node')
  }
  if (!elem[secret.hasIf]) {
    elem.$extractContent()
    elem[secret.hasIf] = true
  }

  if (show && !elem[secret.showing]) {
    elem.$insertContent()
    elem[secret.showing] = true
  } else if (!show && elem[secret.showing]) {
    elem.$removeContent()
    elem[secret.showing] = false
  }
}

function repeatAttribute (array, elem) {
  if (elem[secret.hasIf]) {
    throw new Error('cant use if and repeat on the same node')
  }
  if (!elem[secret.hasRepeat]) {
    elem.$extractContent()
    elem[secret.prevArray] = []
    elem[secret.hasRepeat] = true
  }
  if (!Array.isArray(array)) {
    return
  }

  const repeatValue = elem.getAttribute('repeat-value') || '$value'
  const repeatIndex = elem.getAttribute('repeat-index') || '$index'
  const prevArray = elem[secret.prevArray]
  let viewIndex = 0
  for (let i = 0; i < Math.max(array.length, prevArray.length); i++) {
    if (prevArray[i] !== array[i]) {
      if (array[i] === undefined) {
        elem.$removeContent(viewIndex)
        viewIndex--
      } else if (prevArray[i] === undefined) {
        elem.$insertContent(viewIndex, {[repeatValue]: array[viewIndex], [repeatIndex]: viewIndex})
      } else {
        elem.$replaceContent(viewIndex, {[repeatValue]: array[viewIndex], [repeatIndex]: viewIndex})
      }
      prevArray[i] = array[i]
    }
    viewIndex++
  }
}
