'use strict'

const observer = require('@risingstack/nx-observe')
const exposed = require('../core/symbols')
const secret = {
  template: Symbol('content template'),
  state: Symbol('content state')
}

module.exports = function content (node, state, next) {
  if (!(node instanceof Element)) {
    return next()
  }
  node.$using('content')

  node[secret.state] = state

  node.$extractContent = $extractContent
  node.$insertContent = $insertContent
  node.$removeContent = $removeContent
  node.$replaceContent = $replaceContent

  return next()
}

function $extractContent () {
  const template = document.createDocumentFragment()
  let node = this.firstChild
  while (node) {
    template.appendChild(node)
    node = this.firstChild
  }
  template.appendChild(document.createComment('#separator#'))
  this[secret.template] = template
}

function $insertContent (index, contextState) {
  if (index === undefined) {
    index = 0
  }
  if (typeof index !== 'number') {
    throw new TypeError('first argument must be a number')
  }
  if (contextState !== undefined && typeof contextState !== 'object') {
    throw new TypeError('second argument must be an object or undefined')
  }
  if (!this[secret.template]) {
    throw new Error('you must extract a template with $extractContent before inserting')
  }

  const content = document.importNode(this[secret.template], true)

  if (contextState) {
    contextState = observer.observable(contextState)
    Object.setPrototypeOf(contextState, this[secret.state])

    let node = content.firstChild
    while (node) {
      node[exposed.contextState] = contextState
      node = node.nextSibling
    }
  }
  this.insertBefore(content, findContentStartAtIndex(this, index))
}

function $removeContent (index) {
  if (index === undefined) {
    index = 0
  }
  if (typeof index !== 'number') {
    throw new TypeError('first argument must be a number')
  }
  let node = findContentStartAtIndex(this, index)
  let next
  while (node && !isSeparator(node)) {
    next = node.nextSibling
    this.removeChild(node)
    node = next
  }
  this.removeChild(node)
}

function $replaceContent (index, contextState) {
  if (index === undefined) {
    index = 0
  }
  if (typeof index !== 'number') {
    throw new TypeError('first argument must be a number')
  }
  if (contextState !== undefined && typeof contextState !== 'object') {
    throw new TypeError('second argument must be an object or undefined')
  }
  this.$removeContent(index)
  this.$insertContent(index, contextState)
}

function findContentStartAtIndex (node, index) {
  node = node.firstChild
  let count = 0
  while (node && count < index) {
    if (isSeparator(node)) count++
    node = node.nextSibling
  }
  return node
}

function isSeparator (node) {
  return (node.nodeType === Node.COMMENT_NODE && node.nodeValue === '#separator#')
}
