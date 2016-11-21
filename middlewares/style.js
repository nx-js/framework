'use strict'

function style (elem) {
  if (elem.nodeType !== 1) return

  elem.$attribute('class', classAttribute)
  elem.$attribute('style', styleAttribute)
}
style.$name = 'style'
style.$require = ['attributes']
module.exports = style

function classAttribute (classes) {
  if (typeof classes === 'object') {
    for (var item in classes) {
      if (classes[item]) {
        this.classList.add(item)
      } else if (this.className) {
        this.classList.remove(item)
      }
    }
  } else if (this.className !== classes) {
    this.className = classes
  }
}

function styleAttribute (styles) {
  if (typeof styles === 'object') {
    Object.assign(this.style, styles)
  } else if (this.style.cssText !== styles) {
    this.style.cssText = styles
  }
}
