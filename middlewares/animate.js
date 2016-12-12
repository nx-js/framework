'use strict'

const secret = {
  entering: Symbol('during entering animation'),
  leaving: Symbol('during leaving animation'),
  moveTransition: Symbol('watch move transition'),
  position: Symbol('animated element position'),
  parent: Symbol('parent node of leaving node')
}
const watchedNodes = new Set()
let checkQueued = false

function onAnimationEnd (ev) {
  const elem = ev.target
  if (elem[secret.leaving]) {
    elem.remove()
  }
  if (elem[secret.entering]) {
    elem.style.animation = ''
    elem[secret.entering] = false
  }
}

function animate (elem) {
  if (elem.nodeType !== 1) return

  if (elem.$root) {
    elem.addEventListener('animationend', onAnimationEnd, true)
  }
  if (elem.shadowRoot) {
    elem.shadowRoot.addEventListener('animationend', onAnimationEnd, true)
  }

  elem.$attribute('enter-animation', enterAttribute)
  elem.$attribute('leave-animation', leaveAttribute)
  elem.$attribute('move-animation', moveAttribute)

  Promise.resolve().then(queueCheck)
  elem.$cleanup(queueCheck)
}
animate.$name = 'animate'
animate.$require = ['attributes']
module.exports = animate

function enterAttribute (animation) {
  if (this[secret.entering] !== false) {
    this[secret.entering] = true
    if (typeof animation === 'object' && animation) {
      animation = animationObjectToString(animation)
    } else if (typeof animation === 'string') {
      animation = animation
    }
    this.style.animation = animation
    setAnimationDefaults(this)
  }
}

function leaveAttribute (animation) {
  watchedNodes.add(this)
  this.$cleanup(onLeave, animation)
  this[secret.parent] = this.parentNode
}

function onLeave (animation) {
  this[secret.leaving] = true
  watchedNodes.delete(this)
  if (typeof animation === 'object' && animation) {
    animation = animationObjectToString(animation)
  } else if (typeof animation === 'string') {
    animation = animation
  }
  this.style.animation = animation
  setAnimationDefaults(this)

  this[secret.parent].appendChild(this)
  if (shouldAbsolutePosition(this)) {
    toAbsolutePosition(this)
  }
}

function moveAttribute (transition) {
  this[secret.moveTransition] = true
  watchedNodes.add(this)
  this.$cleanup(unwatch)
  if (typeof transition === 'object' && transition) {
    transition = 'transform ' + transitionObjectToString(transition)
  } else if (typeof transition === 'string') {
    transition = 'transform ' + transition
  } else {
    transition = 'transform'
  }
  this.style.transition = transition
  setTransitionDefaults(this)
}

function unwatch () {
  watchedNodes.delete(this)
}

function queueCheck () {
  if (!checkQueued && watchedNodes.size) {
    checkQueued = true
    requestAnimationFrame(checkWatchedNodes)
  }
}

function checkWatchedNodes () {
  for (let elem of watchedNodes) {
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
  const style = elem.style
  const transition = style.transition
  style.transition = ''
  style.transform = `translate3d(${xDiff}px, ${yDiff}px, 0)`
  requestAnimationFrame(() => {
    style.transition = transition
    style.transform = ''
  })
}

function animationObjectToString (animation) {
  return [
    animation.name,
    timeToString(animation.duration),
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
  const duration = style.animationDuration
  const fillMode = style.animationFillMode
  if (duration === 'initial' || duration === '' || duration === '0s') {
    style.animationDuration = '1s'
  }
  if (fillMode === 'initial' || fillMode === '' || fillMode === 'none') {
    style.animationFillMode = 'both'
  }
}

function setTransitionDefaults (elem) {
  const style = elem.style
  const duration = style.transitionDuration
  if (duration === 'initial' || duration === '' || duration === '0s') {
    style.transitionDuration = '1s'
  }
}

function shouldAbsolutePosition (elem) {
  elem = elem.parentNode || elem.host
  while (elem) {
    if (elem[secret.leaving]) return false
    if (elem.$root) return true
    elem = elem.parentNode || elem.host
  }
}

function toAbsolutePosition (elem) {
  const style = elem.style
  const position = elem[secret.position]
  style.left = `${position.left}px`
  style.top = `${position.top}px`
  style.margin = '0'
  style.width = '-moz-max-content'
  style.width = '-webkit-max-content'
  style.width = 'max-content'
  style.position = 'absolute'
}

function timeToString (time) {
  return (typeof time === 'number') ? time + 'ms' : time
}

function boolToPlayState (bool) {
  return (bool === false || bool === 'paused') ? 'paused' : 'running'
}
