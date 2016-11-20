'use strict'

const secret = {
  template: Symbol('content template'),
  firstNodes: Symbol('first nodes')
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
  this[secret.template] = template
  this[secret.firstNodes] = []
  return template
}

function processContent (node) {
  if (node.nodeType === 1) {
    node.setAttribute('clone-id', cloneId++)
    const childNodes = node.childNodes
    let i = childNodes.length
    while (i--) {
      processContent(childNodes[i])
    }
  } else if (node.nodeType === 3) {
    if (!node.nodeValue.trim()) node.remove()
  } else {
    node.remove()
  }
}

function $insertContent (index, contextState) {
  if (index !== undefined && typeof index !== 'number') {
    throw new TypeError('first argument must be a number or undefined')
  }
  if (contextState !== undefined && typeof contextState !== 'object') {
    throw new TypeError('second argument must be an object or undefined')
  }
  if (!this[secret.template]) {
    throw new Error('you must extract a template with $extractContent before inserting')
  }
  const content = document.importNode(this[secret.template], true)
  var firstNode = content.firstChild

  if (contextState) {
    contextState = Object.assign(Object.create(this.$state), contextState)
    let node = firstNode
    while (node) {
      node.$contextState = contextState
      node = node.nextSibling
    }
  }

  var firstNodes = this[secret.firstNodes]
  var beforeNode = firstNodes[index]
  if (beforeNode) {
    this.insertBefore(content, beforeNode)
    firstNodes.splice(index, 0, firstNode)
  } else {
    this.appendChild(content)
    firstNodes.push(firstNode)
  }
}

function $removeContent (index) {
  if (index !== undefined && typeof index !== 'number') {
    throw new TypeError('first argument must be a number or undefined')
  }
  const firstNodes = this[secret.firstNodes]
  index = firstNodes[index] ? index : (firstNodes.length - 1)
  const firstNode = firstNodes[index]
  const nextNode = firstNodes[index + 1]


  let node = firstNode
  let next
  while (node && node !== nextNode) {
    next = node.nextSibling
    node.remove()
    node = next
  }

  if (nextNode) {
    firstNodes.splice(index, 1)
  } else {
    firstNodes.pop()
  }
}

function $clearContent () {
  this.innerHTML = ''
  this[secret.firstNodes] = []
}

function $moveContent (fromIndex, toIndex) {
  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
    throw new Error('first and second argument must be numbers')
  }
  const firstNodes = this[secret.firstNodes]
  const fromNode = firstNodes[fromIndex]
  const untilNode = firstNodes[fromIndex + 1]
  const toNode = firstNodes[toIndex]

  let node = fromNode
  let next
  // do not do this if it is a single node (no loop needed)!
  while (node && node !== untilNode) {
    next = node.nextSibling
    this.insertBefore(node, toNode)
    node = next
  }
  firstNodes.splice(fromIndex, 1)
  firstNodes.splice(toIndex, 0, fromNode)

  if (fromNode && fromNode.$contextState) {
    fromNode.$contextState.$index = toIndex
  }
}

function $mutateContext (index, extraContext) {
  if (index !== undefined && typeof index !== 'number') {
    throw new TypeError('first argument must be a number or undefined')
  }
  if (typeof extraContext !== 'object') {
    throw new TypeError('second argument must be an object')
  }
  const startNode = this[secret.firstNodes][index]
  if (startNode && startNode.$contextState) {
    Object.assign(startNode.$contextState, extraContext)
  }
}
