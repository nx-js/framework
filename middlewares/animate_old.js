'use strict'

const secret = {
  state: Symbol('animation state'),
  entered: Symbol('animation entered')
}

module.exports = function animate (elem, state, next) {
  if (!(elem instanceof Element)) return
  elem.$require('attributes')
  elem.$using('animate')

  elem[secret.state] = state

  elem.$attribute('animation', animationAttribute)
}

function animationAttribute (animation, elem) {
  const state = elem[secret.state]
  elem.classList.add('animated')

  if (typeof animation === 'string') {
    animation = parse(animation)
  }
  if (animation.trigger) {
    elem.$observe(() => {
      const active = state[animation.trigger]
      if (active && !elem[secret.entered]) {
        if (animation.enter) {
          elem.classList.remove(animation.leave)
          elem.classList.add(animation.enter)
        }
        elem[secret.entered] = true
      } else if (!active && elem[secret.entered]) {
        if (animation.leave) {
          elem.classList.remove(animation.enter)
          elem.classList.add(animation.leave)
        }
        elem[secret.entered] = false
      }
    })
  }
}

function parse (animation) {
  animation = animation.split(' ')
  return {
    enter: animation[0],
    leave: animation[1],
    trigger: animation[2]
  }
}
