'use strict'

const symbols = require('../core').symbols
const observer = require('@risingstack/nx-observe')

const contentTemplate = Symbol('contentTemplate')
const ownerState = Symbol('ownerState')

module.exports = function content (node, state, next) {
  if (!(node instanceof Element)) {
    return next()
  }
  node.$using('content')

  node[ownerState] = state

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
  this[contentTemplate] = template
}

function $insertContent (index = 0, contextState) {
  if (typeof index !== 'number') {
    throw new TypeError('first argument must be a number')
  }
  if (contextState !== undefined && typeof contextState !== 'object') {
    throw new TypeError('second argument must be an object or undefined')
  }
  if (!this[contentTemplate]) {
    throw new Error('you must extract a template with $extractContent before inserting')
  }

  const content = document.importNode(this[contentTemplate], true)
  if (contextState) {
    contextState = observer.observable(contextState)
    Object.setPrototypeOf(contextState, this[ownerState])
  }

  let node = content.firstChild
  while (node) {
    node[symbols.contextState] = contextState
    node = node.nextSibling
  }
  this.insertBefore(content, findContentStartAtIndex(this, index))
}

function $removeContent (index = 0) {
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

function $replaceContent (index = 0, contextState) {
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
