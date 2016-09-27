'use strict'

const secret = {
  originalRemove: Symbol('element original remove')
}

module.exports = function animate (elem, state) {
  if (!(elem instanceof Element)) return
  elem.$using('animate')

  if (elem.hasAttribute('enter')) {
    elem.style.animation = elem.getAttribute('enter')
  }
  if (elem.hasAttribute('leave')) {
    elem[secret.originalRemove] = elem.remove
    elem.remove = function patchedRemove () {
      this.style.left = this.offsetLeft + 'px'
      console.log(this.offsetHeight)
      this.style.top = this.offsetTop + 'px'
      this.style.position = 'absolute'
      this.style.animation = this.getAttribute('leave')
      this.addEventListener('animationend', this[secret.originalRemove])
    }
  }
}
