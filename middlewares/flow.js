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
  const trackBy = elem.getAttribute('track-by')
  const repeatValue = elem.getAttribute('repeat-value')

  array = array || []
  const prevArray = elem[secret.prevArray] = elem[secret.prevArray] || []

  let i = -1
  iteration: for (let item of array) {
    let prevItem = prevArray[++i]

    if (prevItem === undefined) {
      elem.$insertContent(i, {$index: i, [repeatValue]: item})
      prevArray[i] = item
      continue
    }
    if (item === prevItem) {
      continue
    }
    if (trackBy === '$index') {
      elem.$mutateContext(i, {[repeatValue]: item})
      prevArray[i] = item
      continue
    }
    if (trackBy && isTrackBySame(item, prevItem, trackBy)) {
      continue
    }
    for (let j = i + 1; j < prevArray.length; j++) {
      prevItem = prevArray[j]
      if (item === prevItem || (trackBy && isTrackBySame(item, prevItem, trackBy))) {
        elem.$moveContent(j, i)
        prevArray.splice(i, 0, prevItem)
        prevArray.splice(j, 1)
        continue iteration
      }
    }
    elem.$insertContent(i, {$index: i, [repeatValue]: item})
    prevArray.splice(i, 0, item)
  }

  if ((++i) === 0) {
    prevArray.length = 0
    elem.$clearContent()
  } else {
    while (i < prevArray.length) {
      elem.$removeContent()
      prevArray.pop()
    }
  }
}

function isTrackBySame (item1, item2, trackBy) {
  return (typeof item1 === 'object' && typeof item2 === 'object' &&
  item1 && item2 && item1[trackBy] === item2[trackBy])
}
