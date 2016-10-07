'use strict'

const exposed = require('../core/symbols')
const secret = {
  entering: Symbol('during entering animation'),
  entered: Symbol('after entering animation'),
  leaving: Symbol('during leaving animation'),
  resizing: Symbol('during resize animation'),
  moveTransition: Symbol('watch move transition'),
  sizeTransition: Symbol('watch size transition'),
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
    elem[secret.entering] = false
    elem[secret.entered] = true
    elem.style.animation = ''
  }
}

function onTransitionEnd (ev) {
  const elem = ev.target
  if (elem[secret.resizing]) {
    elem.style.width = ''
    elem.style.height = ''
    elem[secret.resizing] = false
  }
}

module.exports = function animate (elem, state) {
  if (!(elem instanceof Element)) return
  elem.$require('attributes')
  elem.$using('animate')

  elem.$attribute('enter-animation', enterAttribute)
  elem.$attribute('leave-animation', leaveAttribute)
  elem.$attribute('move-animation', moveAttribute)
  elem.$attribute('size-animation', sizeAttribute)

  queueCheck()
  elem.$cleanup(queueCheck)
}

function enterAttribute (animation, elem) {
  toBlockDisplay(elem)
  if (!elem[secret.entered] && shouldAnimate(elem.parentNode)) {
    elem[secret.entering] = true
    if (typeof animation === 'object' && animation !== null) {
      setAnimation(elem, animation)
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
    if (shouldAnimate(parent)) {
      elem[secret.leaving] = true
      if (typeof animation === 'object' && animation !== null) {
        setAnimation(elem, animation)
      } else if (typeof animation === 'string') {
        elem.style.animation = animation
      }
      setAnimationDefaults(elem)
      toAbsolutePosition(elem)
      parent.appendChild(elem)
    }
  })
}

function moveAttribute (transition, elem) {
  elem[secret.moveTransition] = true
  watchedNodes.add(elem)
  elem.$cleanup(unwatch)
  if (typeof transition === 'object' && transition !== null) {
    elem.style.transitionProperty = 'transform'
    setTransition(elem, transition)
  } else if (typeof transition === 'string') {
    elem.style.transition = 'transform ' + transition
  } else if (transition) {
    elem.style.transition = 'transform 1s'
  }
  setTransitionDefaults(elem)
  toBlockDisplay(elem)
}

function sizeAttribute (transition, elem) {
  elem[secret.sizeTransition] = true
  watchedNodes.add(elem)
  elem.$cleanup(unwatch)
  if (typeof transition === 'object' && transition !== null) {
    elem.style.transitionProperty = 'width, height'
    setTransition(elem, transition)
  } else if (typeof transition === 'string') {
    elem.style.transition = `width ${transition}, height ${transition}`
  } else if (transition) {
    elem.style.transition = 'width 1s, height 1s'
  }
  setTransitionDefaults(elem)
  toBorderBox(elem)
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
    const parentRect = elem.offsetParent ? elem.offsetParent.getBoundingClientRect() : {}
    const position = {
      left: elem.offsetLeft,
      top: elem.offsetTop,
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
      scrollWidth: elem.scrollWidth,
      scrollHeight: elem.scrollHeight
    }
    // problem with translateX, seems to be bugged!!
    position.translateX = position.left - Math.round(rect.left) + Math.round(parentRect.left) || 0
    position.translateY = position.top - Math.round(rect.top) + Math.round(parentRect.top) || 0

    console.log(position.translateX, position.translateY)

    const prevPosition = elem[secret.position] || {}
    elem[secret.position] = position

    const xDiff = prevPosition.left - position.left - position.translateX || 0 // translateX is bugged
    const yDiff = prevPosition.top - position.top - position.translateY || 0
    const widthDiff = position.scrollWidth - prevPosition.scrollWidth || 0
    const heightDiff = position.scrollHeight - prevPosition.scrollHeight || 0

    if (elem[secret.moveTransition] && shouldAnimate(elem) && (xDiff || yDiff)) {
      onMove(elem, xDiff, yDiff)
    }
    if (elem[secret.sizeTransition] && shouldAnimate(elem) && (widthDiff || heightDiff)) {
      onResize(elem, prevPosition.scrollWidth, position.scrollWidth, prevPosition.scrollHeight, position.scrollHeight)
    }
  }
  checkQueued = false
}

function onMove (elem, xDiff, yDiff) {
  const prevTransitionValue = elem.style.transition
  elem.style.transition = ''
  elem.style.transform = `translate3d(${xDiff}px, ${yDiff}px, 0)`
  requestAnimationFrame(() => {
    elem.style.transition = prevTransitionValue
    elem.style.transform = ''
  })
}

function onResize (elem, prevWidth, width, prevHeight, height) {
  elem[secret.resizing] = true
  elem.style.width = prevWidth + 4 + 'px'
  elem.style.height = prevHeight + 4 + 'px'
  requestAnimationFrame(() => {
    elem.style.width = width + 4 + 'px'
    elem.style.height = height + 4 + 'px'
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
  style.left = `${position.left}px`
  style.top = `${position.top}px`
  style.width = `${position.width + 1}px`
  style.height = `${position.height + 1}px`
  style.position = style.position || 'absolute'
}

function toBlockDisplay (elem) {
  let style = elem.style
  if (style.display && style.display !== 'initial' && style.display !== 'inline') {
    return
  }
  style = window.getComputedStyle(elem)
  if (!style.display || style.display === 'initial' || style.display === 'inline') {
    elem.style.display = 'inline-block'
  }
}

function toBorderBox (elem) {
  elem.style.boxSizing = 'border-box'
}

function shouldAnimate (elem) {
  while (elem) {
    if (elem[secret.entering] || elem[secret.leaving]) {
      return false
    }
    if (elem[exposed.root]) {
      break
    }
    elem = elem.parentNode
  }
  return true
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
