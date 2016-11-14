'use strict'

const secret = {
  template: Symbol('content template'),
  separators: Symbol('content separators')
}
let cloneId = 0

function content (elem) {
  if (elem.nodeType !== 1) return

  elem.$extractContent = $extractContent
  elem.$insertContent = $insertContent
  elem.$moveContent = $moveContent
  elem.$removeContent = $removeContent
  elem.$clearContent = $clearContent
  elem.$mutateContext = $mutateContext
}
content.$name = 'content'
module.exports = content

function $extractContent () {
  const template = document.createDocumentFragment()
  let node = this.firstChild
  while (node) {
    template.appendChild(node)
    processContent(node)
    node = this.firstChild
  }
  template.appendChild(document.createComment('#separator#'))
  this[secret.template] = template
  this[secret.separators] = []
  return template
}

function processContent (node) {
  if (node.nodeType === 1) {
    node.setAttribute('clone-id', cloneId++)
    const childNodes = node.childNodes
    for (let i = childNodes.length; i--;) {
      processContent(childNodes[i])
    }
  } else if (node.nodeType === 3 && !node.nodeValue.trim()) {
    node.remove()
  }
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
  const separators = this[secret.separators]
  const separator = content.lastChild

  if (contextState) {
    contextState = Object.assign(Object.create(this.$state), contextState)
    let node = separator.previousSibling
    while (node) {
      node.$contextState = contextState
      node = node.previousSibling
    }
  }

  if (index === separators.length) {
    this.appendChild(content)
    separators.push(separator)
  } else {
    this.insertBefore(content, findContentStartAtIndex(this, index))
    separators.splice(index, 0, separator)
  }
}

function $removeContent (index) {
  index = index || 0
  if (index !== undefined && typeof index !== 'number') {
    throw new TypeError('first argument must be a number or undefined')
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

  const separators = this[secret.separators]
  if (index === separators.length) {
    separators.pop()
  } else {
    separators.splice(index, 1)
  }
}

function $clearContent () {
  this.textContent = ''
  this[secret.separators] = []
}

function $moveContent (fromIndex, toIndex) {
  fromIndex = fromIndex || 0
  toIndex = toIndex || 0
  if (!this[secret.template]) {
    throw new Error('you must extract a template with $extractContent before removing')
  }
  let fromNode = findContentStartAtIndex(this, fromIndex)
  const toNode = findContentStartAtIndex(this, toIndex)
  let fromNext
  while (fromNode && !isSeparator(fromNode)) {
    fromNext = fromNode.nextSibling
    this.insertBefore(fromNode, toNode)
    fromNode = fromNext
  }
  this.insertBefore(fromNode, toNode)
  const separators = this[secret.separators]
  const fromSeparator = separators[fromIndex]
  separators[fromIndex] = separators[toIndex]
  separators[toIndex] = fromSeparator

  // this should not be here -> maybe move it to flow with mutateContext later
  if (fromNode && fromNode.$contextState) {
    fromNode.$contextState.$index = toIndex
  }
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
  if (startNode && startNode.$contextState) {
    Object.assign(startNode.$contextState, extraContext)
  }
}

function findContentStartAtIndex (node, index) {
  index--
  if (index < 0) {
    return node.firstChild
  }
  const separator = node[secret.separators][index]
  return separator ? separator.nextSibling : undefined
}

function isSeparator (node) {
  return (node.nodeType === 8 && node.nodeValue === '#separator#')
}
