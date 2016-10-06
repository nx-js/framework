'use strict'

const exposed = require('../core/symbols')
const secret = {
  entering: Symbol('during entering animation'),
  entered: Symbol('after entering animation'),
  leaving: Symbol('during leaving animation'),
  moving: Symbol('during moving animation'),
  moveTransition: Symbol('move transition'),
  display: Symbol('original display'),
  position: Symbol('animated element position')
}
const watchedNodes = new Set()
let checkQueued = false

window.addEventListener('animationend', onAnimationEnd, true)
window.addEventListener('transitionend', onTransitionEnd, true)

function onAnimationEnd (ev) {
  const elem = ev.target
  if (elem[secret.leaving]) {
    elem.remove()
  }
  if (elem[secret.entering]) {
    elem.style.animation = ''
    elem[secret.entering] = false
    elem[secret.entered] = true
    elem.style.display = elem[secret.display]
  }
}

function onTransitionEnd (ev) {
  const elem = ev.target
  if (elem[secret.moving]) {
    elem.style.transition = ''
    elem[secret.moving] = false
    elem.style.display = elem[secret.display]
  }
}

module.exports = function animate (elem, state) {
  if (!(elem instanceof Element)) return
  elem.$require('attributes')
  elem.$using('animate')

  elem.$attribute('enter-animation', enterAttribute)
  elem.$attribute('leave-animation', leaveAttribute)
  elem.$attribute('move-animation', moveAttribute)

  queueCheck()
  elem.$cleanup(queueCheck)
}

function enterAttribute (animation, elem) {
  if (!elem[secret.entered]) {
    elem[secret.entering] = true
    if (typeof animation === 'object' && animation !== null) {
      setAnimation(elem, animation)
    } else if (typeof animation === 'string') {
      elem.style.animation = animation
    }
    setAnimationDefaults(elem)
    toBlockDisplay(elem)
  }
}

function leaveAttribute (animation, elem) {
  const parent = elem.parentNode
  watchedNodes.add(elem)
  elem.$cleanup(unwatch)
  elem.$cleanup(() => {
    elem[secret.leaving] = true
    if (typeof animation === 'object' && animation !== null) {
      setAnimation(elem, animation)
    } else if (typeof animation === 'string') {
      elem.style.animation = animation
    }
    setAnimationDefaults(elem)
    toAbsolutePosition(elem)
    parent.appendChild(elem)
  })
}

function moveAttribute (transition, elem) {
  watchedNodes.add(elem)
  elem.$cleanup(unwatch)
  elem[secret.moveTransition] = transition || true
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
    const position = {
      left: elem.offsetLeft,
      top: elem.offsetTop,
      width: elem.offsetWidth,
      height: elem.offsetHeight
    }
    const prevPosition = elem[secret.position] || {}
    elem[secret.position] = position

    const xDiff = prevPosition.left - position.left || 0
    const yDiff = prevPosition.top - position.top || 0
    if (elem[secret.moveTransition] && (xDiff || yDiff)) {
      onMove(elem, xDiff, yDiff)
    }
  }
  checkQueued = false
}

function onMove (elem, xDiff, yDiff) {
  elem[secret.moving] = true
  elem.style.transform = `translate3d(${xDiff}px, ${yDiff}px, 0)`
  requestAnimationFrame(() => {
    const transition = elem[secret.moveTransition]
    if (typeof transition === 'object' && transition !== null) {
      elem.style.transitionProperty = 'transform'
      setTransition(elem, transition)
    } else if (typeof transition === 'string') {
      elem.style.transition = 'transform ' + transition
    } else if (transition) {
      elem.style.transition = 'transform'
    }
    elem.style.transform = ''
    toBlockDisplay(elem)
    setTransitionDefaults(elem)
  })
}

function setAnimation (elem, animation) {
  const style = elem.style
  style.animationName = animation.name
  style.animationDuration = timeToString(animation.duration)
  style.animationTimingFunction = animation.timingFunction
  style.animationDelay = timeToString(animation.delay)
  style.animationIterationCount = animation.iterationCount
  style.animationDirection = animation.direction
  style.animationFillMode = animation.fillMode
  style.animationPlayState = boolToPlayState(animation.playState)
}

function setAnimationDefaults (elem) {
  const style = elem.style
  if (!style.animationDuration || style.animationDuration === 'initial') {
    style.animationDuration = '1s'
  }
  if (!style.animationFillMode || style.animationFillMode === 'initial') {
    style.animationFillMode = 'both'
  }
}

function setTransition (elem, transition) {
  const style = elem.style
  style.transitionDuration = timeToString(transition.duration)
  style.transitionDelay = timeToString(transition.delay)
  style.transitionTimingFunction = transition.timingFunction
}

function setTransitionDefaults (elem) {
  const style = elem.style
  if (!style.transitionDuration || style.transitionDuration === 'initial') {
    style.transitionDuration = '1s'
  }
}

function toAbsolutePosition (elem) {
  const style = elem.style
  const position = elem[secret.position]
  if (position && style.position !== 'fixed' && style.position !== 'absolute') {
    style.left = `${position.left}px`
    style.top = `${position.top}px`
    style.width = `${position.width + 1}px` // rounding
    style.height = `${position.height + 1}px` // rounding
    style.position = 'absolute'
  }
}

function toBlockDisplay (elem) {
  const style = window.getComputedStyle(elem)
  console.log(style)
  elem[secret.display] = elem.style.display
  if (!style.display || style.display === 'initial' || style.display === 'inline') {
    elem.style.display = 'inline-block'
  }
}

function timeToString (time) {
  if (typeof time === 'number') {
    return time + 'ms'
  }
  if (typeof time !== 'string') {
    return time
  }
  return '0ms'
}

function boolToPlayState (bool) {
  if (bool === 'paused' || bool === 'running') {
    return bool
  }
  if (bool === false) {
    return 'paused'
  }
  return 'running'
}
