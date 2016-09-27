'use strict'

const observer = require('@risingstack/nx-observe')
const exposed = require('../core/symbols')
const secret = {
  template: Symbol('content template'),
  separators: Symbol('content separators'),
  state: Symbol('content state')
}

module.exports = function content (node, state) {
  if (!(node instanceof Element)) return
  node.$using('content')

  node[secret.state] = state

  node.$extractContent = $extractContent
  node.$insertContent = $insertContent
  node.$removeContent = $removeContent
  node.$replaceContent = $replaceContent
  node.$mutateContext = $mutateContext
}

function $extractContent () {
  const template = document.createDocumentFragment()
  let node = this.firstChild
  while (node) {
    template.appendChild(node)
    node = this.firstChild
  }
  this[secret.template] = template
  this[secret.separators] = []
}

function $insertContent (index, contextState) {
  index = index || 0
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
  const separator = document.createComment('#separator#')
  content.appendChild(separator)

  if (contextState) {
    contextState = Object.assign(Object.create(this[secret.state]), contextState)
    contextState = observer.observable(contextState)

    let node = content.firstChild
    while (node) {
      node[exposed.contextState] = contextState
      node = node.nextSibling
    }
  }
  this.insertBefore(content, findContentStartAtIndex(this, index))
  this[secret.separators].splice(index, 0, separator)
}

function $removeContent (index) {
  index = index || 0
  if (typeof index !== 'number') {
    throw new TypeError('first argument must be a number')
  }
  if (!this[secret.template]) {
    throw new Error('you must extract a template with $extractContent before removing')
  }
  let node = findContentStartAtIndex(this, index)
  let next
  while (node && !isSeparator(node)) {
    next = node.nextSibling
    node.remove()
    node = next
  }
  node.remove()
  this[secret.separators].splice(index, 1)
}

function $replaceContent (index, contextState) {
  index = index || 0
  if (typeof index !== 'number') {
    throw new TypeError('first argument must be a number')
  }
  if (contextState !== undefined && typeof contextState !== 'object') {
    throw new TypeError('second argument must be an object or undefined')
  }
  this.$removeContent(index)
  this.$insertContent(index, contextState)
}

function $mutateContext (index, extraContext) {
  index = index || 0
  if (typeof index !== 'number') {
    throw new TypeError('first argument must be a number')
  }
  if (typeof extraContext !== 'object') {
    throw new TypeError('second argument must be an object')
  }
  const startNode = findContentStartAtIndex(this, index)
  if (startNode) {
    const contextState = startNode[exposed.contextState]
    if (contextState) {
      Object.assign(contextState, extraContext)
    }
  }
}

function findContentStartAtIndex (node, index) {
  index--
  const separators = node[secret.separators]
  if (index < 0) {
    return node.firstChild
  }
  if (separators[index]) {
    return separators[index].nextSibling
  }
}

function isSeparator (node) {
  return (node.nodeType === Node.COMMENT_NODE && node.nodeValue === '#separator#')
}
