'use strict'

const secret = {
  showing: Symbol('flow showing'),
  prevArray: Symbol('flow prevArray')
}

function flow (elem) {
  if (elem.nodeType !== 1) return

  setupFlow(elem)
  elem.$attribute('if', ifAttribute)
  elem.$attribute('repeat', repeatAttribute)
}
flow.$name = 'flow'
flow.$require = ['content', 'attributes']
module.exports = flow

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
    elem[secret.prevArray] = []
    elem.innerHTML = ''
    return
  }
  array = Array.from(array)
  if (!array.length) {
    elem[secret.prevArray] = []
    elem.innerHTML = ''
    return
  }
  elem[secret.prevArray] = elem[secret.prevArray] || []
  const prevArray = elem[secret.prevArray]

  const trackBy = elem.getAttribute('track-by')
  const value = elem.getAttribute('value')
  if (!value) {
    throw new Error('You must provide a "value" attribute as the name of the current value property.')
  }

  for (let i = 0; i < array.length; i++) {
    const item = array[i]
    let found = false

    for (let j = i; j < prevArray.length; j++) {
      const prevItem = prevArray[j]
      if (trackBy === '$index' || isSame(item, prevItem, trackBy)) {
        if (i === j) {
          elem.$mutateContext(i, {'$index': i, [value]: item})
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
      elem.$insertContent(i, {'$index': i, [value]: item})
    }
  }

  while (array.length < prevArray.length) {
    prevArray.splice(array.length, 1)
    elem.$removeContent(array.length)
  }
}

function isSame (item1, item2, trackBy) {
  return (item1 === item2) ||
  (trackBy && item1 && item2 && typeof item1 === 'object' && typeof item2 === 'object' &&
  item1[trackBy] === item2[trackBy])
}

function setupFlow (elem) {
  const hasIf = elem.hasAttribute('if') || elem.hasAttribute('$if') || elem.hasAttribute('@if')
  const hasRepeat = elem.hasAttribute('repeat') || elem.hasAttribute('$repeat') || elem.hasAttribute('@repeat')
  if (hasIf && hasRepeat) {
    throw new Error('It is forbidden to use the if and repeat attribute on the same element.')
  } else if (hasIf || hasRepeat) {
    elem.$extractContent()
  }
}
