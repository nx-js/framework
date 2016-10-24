'use strict'

const exposed = require('../core/symbols')
const secret = {
  entering: Symbol('during entering animation'),
  leaving: Symbol('during leaving animation'),
  moveTransition: Symbol('watch move transition'),
  position: Symbol('animated element position')
}
const watchedNodes = new Set()
let checkQueued = false

window.addEventListener('animationend', onAnimationEnd, true)

function onAnimationEnd (ev) {
  const elem = ev.target
  if (elem[secret.leaving]) {
    elem.remove()
  }
  if (elem[secret.entering]) {
    elem[secret.entering] = false
    elem.style.animation = ''
  }
}

module.exports = function animate (elem, state) {
  if (elem.nodeType !== 1) return
  elem.$require('attributes')
  elem.$using('animate')

  elem.$attribute('enter-animation', enterAttribute)
  elem.$attribute('leave-animation', leaveAttribute)
  elem.$attribute('move-animation', moveAttribute)

  queueCheck()
  elem.$cleanup(queueCheck)
}

function enterAttribute (animation, elem) {
  if (elem[secret.entering] !== false) {
    elem[secret.entering] = true
    if (typeof animation === 'object' && animation !== null) {
      elem.style.animation = animationObjectToString (animation)
    } else if (typeof animation === 'string') {
      elem.style.animation = animation
    }
    setAnimationDefaults(elem)
  }
}

function leaveAttribute (animation, elem) {
  const parent = elem.parentNode
  watchedNodes.add(elem)
  elem.$cleanup(unwatch)
  elem.$cleanup(() => {
    elem[secret.leaving] = true
    if (typeof animation === 'object' && animation !== null) {
      elem.style.animation = animationObjectToString (animation)
    } else if (typeof animation === 'string') {
      elem.style.animation = animation
    }
    setAnimationDefaults(elem)
    parent.appendChild(elem)
    if (shouldAbsolutePosition(elem)) {
      toAbsolutePosition(elem)
    }
  })
}

function moveAttribute (transition, elem) {
  elem[secret.moveTransition] = true
  watchedNodes.add(elem)
  elem.$cleanup(unwatch)
  if (typeof transition === 'object' && transition !== null) {
    elem.style.transition = transitionObjectToString(transition)
  } else if (typeof transition === 'string') {
    elem.style.transition = 'transform ' + transition
  } else {
    elem.style.transition = 'transform'
  }
  setTransitionDefaults(elem)
}

function unwatch (elem) {
  watchedNodes.delete(elem)
}

function queueCheck () {
  if (!checkQueued) {
    checkQueued = true
    requestAnimationFrame(checkWatchedNodes)
  }
}

function checkWatchedNodes () {
  for (let elem of watchedNodes) {
    const rect = elem.getBoundingClientRect() || {}
    const position = {
      left: elem.offsetLeft,
      top: elem.offsetTop
    }
    const prevPosition = elem[secret.position] || {}
    elem[secret.position] = position

    const xDiff = (prevPosition.left - position.left) || 0
    const yDiff = (prevPosition.top - position.top) || 0
    if (elem[secret.moveTransition] && (xDiff || yDiff)) {
      onMove(elem, xDiff, yDiff)
    }
  }
  checkQueued = false
}

function onMove (elem, xDiff, yDiff) {
  const transition = elem.style.transition
  elem.style.transition = ''
  elem.style.transform = `translate3d(${xDiff}px, ${yDiff}px, 0)`
  requestAnimationFrame(() => {
    elem.style.transition = transition
    elem.style.transform = ''
  })
}

function animationObjectToString (animation) {
  return [
    animation.name,
    timeToString(animation.duration) || '1s',
    animation.timingFunction,
    timeToString(animation.delay),
    animation.iterationCount,
    animation.direction,
    animation.fillMode,
    boolToPlayState(animation.playState)
  ].join(' ')
}

function transitionObjectToString (transition) {
  return [
    timeToString(transition.duration),
    timeToString(transition.delay),
    transition.timingFunction
  ].join(' ')
}

function setAnimationDefaults (elem) {
  const style = elem.style
  if (style.animationDuration === 'initial' || style.animationDuration === '') {
    elem.style.animationDuration = '1s'
  }
  if (style.animationFillMode === 'initial' || style.animationFillMode === '' || style.animationFillMode === 'none') {
    style.animationFillMode = 'both'
  }
}

function setTransitionDefaults (elem) {
  const style = elem.style
  if (style.transitionDuration === 'initial' || style.transitionDuration === '') {
    style.transitionDuration = '1s'
  }
}

function shouldAbsolutePosition (elem) {
  while (elem) {
    elem = elem.parentNode
    if (elem[secret.leaving]) {
      return false
    }
    if (elem[exposed.root]) {
      return true
    }
  }
  return true
}

function toAbsolutePosition (elem) {
  const style = elem.style
  const position = elem[secret.position]
  style.left = `${position.left}px`
  style.top = `${position.top}px`
  style.width = `${elem.offsetWidth + 1}px` // it always rounds downwards
  style.height = `${elem.offsetHeight + 1}px` // it always rounds downwards
  style.margin = '0'
  style.boxSizing = 'border-box'
  style.position = 'absolute'
}

function timeToString (time) {
  if (typeof time === 'number') {
    return time + 'ms'
  }
  return time
}

function boolToPlayState (bool) {
  if (bool === false || bool === 'paused') {
    return 'paused'
  }
}
