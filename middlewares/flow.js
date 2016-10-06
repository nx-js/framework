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

  for (let i = 0; i < array.length; i++) {
    const item = array[i]
    let found = false

    for (let j = i; j < prevArray.length; j++) {
      const prevItem = prevArray[j]
      if (item === prevItem) {
        if (i === j) {
          elem.$mutateContext(i, { [repeatIndex]: i })
        } else {
          prevArray.splice(i, 0, prevArray.splice(j, 1)[0])
          elem.$moveContent(j, i)
        }
        found = true
        break
      }
    }
    if (!found) {
      prevArray.splice(i, 0, item)
      elem.$insertContent(i, {[repeatValue]: array[i], [repeatIndex]: i})
    }
  }

  while (array.length < prevArray.length) {
    prevArray.splice(array.length, 1)
    elem.$removeContent(array.length)
  }
}
