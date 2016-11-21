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

function ifAttribute (show) {
  if (this[secret.hasRepeat]) {
    throw new Error('You cant use if and repeat on the same node')
  }
  if (!this[secret.hasIf]) {
    this.$extractContent()
    this[secret.hasIf] = true
  }

  if (show && !this[secret.showing]) {
    this.$insertContent()
    this[secret.showing] = true
  } else if (!show && this[secret.showing]) {
    this.$clearContent()
    this[secret.showing] = false
  }
}

function repeatAttribute (array) {
  if (this[secret.hasIf]) {
    throw new Error('You cant use if and repeat on the same node')
  }
  if (!this[secret.hasRepeat]) {
    this.$extractContent()
    this[secret.hasRepeat] = true
  }
  const trackBy = this.getAttribute('track-by')
  const repeatValue = this.getAttribute('repeat-value')

  array = array || []
  const prevArray = this[secret.prevArray] = this[secret.prevArray] || []

  let i = -1
  iteration: for (let item of array) {
    let prevItem = prevArray[++i]

    if (prevItem === undefined) {
      this.$insertContent(i, {$index: i, [repeatValue]: item})
      prevArray[i] = item
      continue
    }
    if (item === prevItem) {
      continue
    }
    if (trackBy === '$index') {
      this.$mutateContext(i, {[repeatValue]: item})
      prevArray[i] = item
      continue
    }
    if (trackBy && isTrackBySame(item, prevItem, trackBy)) {
      continue
    }
    for (let j = i + 1; j < prevArray.length; j++) {
      prevItem = prevArray[j]
      if (item === prevItem || (trackBy && isTrackBySame(item, prevItem, trackBy))) {
        this.$moveContent(j, i)
        prevArray.splice(i, 0, prevItem)
        prevArray.splice(j, 1)
        continue iteration
      }
    }
    this.$insertContent(i, {$index: i, [repeatValue]: item})
    prevArray.splice(i, 0, item)
  }

  if ((++i) === 0) {
    prevArray.length = 0
    this.$clearContent()
  } else {
    while (i < prevArray.length) {
      this.$removeContent()
      prevArray.pop()
    }
  }
}

function isTrackBySame (item1, item2, trackBy) {
  return (typeof item1 === 'object' && typeof item2 === 'object' &&
  item1 && item2 && item1[trackBy] === item2[trackBy])
}
