'use strict'

const secret = {
  showing: Symbol('flow showing'),
  prevArray: Symbol('flow prevArray'),
  hasIf: Symbol('has if'),
  hasRepeat: Symbol('has repeat')
}

function flow (elem) {
  if (elem.nodeType !== 1) return

  elem.$attribute('if', ifAttribute)
  elem.$attribute('repeat', repeatAttribute)
}
flow.$name = 'flow'
flow.$require = ['content', 'attributes']
module.exports = flow

function ifAttribute (show, elem) {
  if (elem[secret.hasRepeat]) {
    throw new Error('You cant use if and repeat on the same node')
  }
  if (!elem[secret.hasIf]) {
    elem.$extractContent()
    elem[secret.hasIf] = true
  }

  if (show && !elem[secret.showing]) {
    elem.$insertContent()
    elem[secret.showing] = true
  } else if (!show && elem[secret.showing]) {
    elem.$clearContent()
    elem[secret.showing] = false
  }
}

function repeatAttribute (array, elem) {
  if (elem[secret.hasIf]) {
    throw new Error('You cant use if and repeat on the same node')
  }
  if (!elem[secret.hasRepeat]) {
    elem.$extractContent()
    elem[secret.hasRepeat] = true
  }

  array = array ? Array.from(array) : []
  if (!array.length) {
    elem[secret.prevArray] = array
    elem.$clearContent()
    return
  }

  const trackBy = elem.getAttribute('track-by')
  const repeatValue = elem.getAttribute('repeat-value')
  if (!repeatValue) {
    throw new Error('You must provide a "repeat-value" attribute as the name of the current value property.')
  }

  const prevArray = elem[secret.prevArray]
  const arrayLength = array.length
  const smallContext = {}
  const bigContext = {}

  if (!prevArray || !prevArray.length) {
    for (let i = 0; i < arrayLength; i++) {
      bigContext.$index = i
      bigContext[repeatValue] = array[i]
      elem.$insertContent(i, bigContext)
    }
    elem[secret.prevArray] = array
    return
  }

  let addedCount = 0
  iteration: for (let i = 0; i < arrayLength; i++) {
    const item = array[i]
    let prevItem = prevArray[i]

    if (item === prevItem) {
      continue iteration
    }
    if (trackBy === '$index' && prevItem) {
      smallContext[repeatValue] = item
      elem.$mutateContext(i, smallContext)
      continue iteration
    }
    if (isTrackBySame(item, prevItem, trackBy)) {
      continue iteration
    }
    for (let j = i + 1; prevItem && !found; prevItem = prevArray[addedCount + j++]) {
      if (item === prevItem || isTrackBySame(item, prevItem, trackBy)) {
        elem.$moveContent(j, i)
        continue iteration
      }
    }
    bigContext[repeatValue] = item
    bigContext.$index = i
    elem.$insertContent(i, bigContext)
    addedCount++
  }

  for (let i = addedCount + prevArray.length - 1; arrayLength < i; i--) {
    elem.$removeContent(i)
  }
  elem[secret.prevArray] = array
}

function isTrackBySame (item1, item2, trackBy) {
  return (typeof item1 === 'object' && typeof item2 === 'object' &&
  item1 && item2 && item1[trackBy] === item2[trackBy])
}
