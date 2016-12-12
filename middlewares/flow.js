'use strict'

const secret = {
  hasIf: Symbol('has if'),
  showing: Symbol('flow showing'),
  hasRepeat: Symbol('has repeat'),
  prevArray: Symbol('flow prevArray'),
  trackBy: Symbol('track by')
}

function flow (elem) {
  if (elem.nodeType !== 1) return

  elem.$attribute('if', ifAttribute)
  elem.$attribute('track-by', trackByAttribute)
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

function trackByAttribute (trackBy) {
  this[secret.trackBy] = trackBy
}

function repeatAttribute (array) {
  if (this[secret.hasIf]) {
    throw new Error('You cant use if and repeat on the same node')
  }
  if (!this[secret.hasRepeat]) {
    this.$extractContent()
    this[secret.hasRepeat] = true
  }

  const repeatValue = this.getAttribute('repeat-value') || '$value'
  const repeatIndex = this.getAttribute('repeat-index') || '$index'

  let trackBy = this[secret.trackBy] || isSame
  let trackByProp
  if (typeof trackBy === 'string') {
    trackByProp = trackBy
    trackBy = isSame
  }

  array = array || []
  const prevArray = this[secret.prevArray] = this[secret.prevArray] || []

  let i = -1
  iteration: for (let item of array) {
    let prevItem = prevArray[++i]

    if (prevItem === item) {
      continue
    }
    if (trackBy(item, prevItem, trackByProp)) {
      this.$mutateContext(i, {[repeatValue]: item})
      prevArray[i] = item
      continue
    }
    for (let j = i + 1; j < prevArray.length; j++) {
      prevItem = prevArray[j]
      if (trackBy(item, prevItem, trackByProp)) {
        this.$moveContent(j, i, {[repeatIndex]: i})
        prevArray.splice(i, 0, prevItem)
        prevArray.splice(j, 1)
        continue iteration
      }
    }
    this.$insertContent(i, {[repeatIndex]: i, [repeatValue]: item})
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

function isSame (item1, item2, prop) {
  return (item1 === item2 ||
    (prop && typeof item1 === 'object' && typeof item2 === 'object' &&
    item1 && item2 && item1[prop] === item2[prop]))
}
