'use strict'

const secret = {
  showing: Symbol('flow showing'),
  prevArray: Symbol('flow prevArray')
}

module.exports = function flow (elem, state, next) {
  if (!(elem instanceof Element)) return
  elem.$require('content', 'attributes')
  elem.$using('flow')

  if (elem.$hasAttribute('if') && elem.hasAttribute('repeat')) {
    throw new Error('cant use if and repeat on the same node')
  }
  if (elem.$hasAttribute('if') || elem.$hasAttribute('repeat')) {
    elem.$extractContent()
  }
  elem.$attribute('if', ifAttribute)
  elem.$attribute('repeat', repeatAttribute)
}

function ifAttribute (show, elem) {
  if (show && !elem[secret.showing]) {
    elem.$insertContent()
    elem[secret.showing] = true
  } else if (!show && elem[secret.showing]) {
    elem.$removeContent()
    elem[secret.showing] = false
  }
}

function repeatAttribute (array, elem) {
  if (array === undefined) {
    return
  }
  array = Array.from(array)
  elem[secret.prevArray] = elem[secret.prevArray] || []
  const prevArray = elem[secret.prevArray]

  const repeatValue = elem.getAttribute('repeat-value') || '$value'
  const repeatIndex = elem.getAttribute('repeat-index') || '$index'

  for (let i = 0; i < Math.max(array.length, prevArray.length); i++) {
    if (prevArray[i] !== array[i]) {
      if (array[i] === undefined || array[i] === prevArray[i+1]) {
        elem.$removeContent(i)
        prevArray.splice(i, 1)
        i--
      } else if (prevArray[i] === undefined || prevArray[i] === array[i+1]) {
        elem.$insertContent(i, {[repeatValue]: array[i], [repeatIndex]: i})
        prevArray.splice(i, 0, array[i])
      } else {
        elem.$replaceContent(i, {[repeatValue]: array[i], [repeatIndex]: i})
        prevArray[i] = array[i]
      }
    } else {
      elem.$mutateContext(i, { [repeatIndex]: i })
    }
  }
}
