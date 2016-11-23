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
  const content = this[secret.template].cloneNode(true)
  const firstNodes = this[secret.firstNodes]
  const firstNode = content.firstChild
  const beforeNode = firstNodes[index]

  if (contextState) {
    contextState = Object.assign(Object.create(this.$state), contextState)
    let node = firstNode
    while (node) {
      node.$contextState = contextState
      node = node.nextSibling
    }
  }

  this.insertBefore(content, beforeNode)
  if (beforeNode) firstNodes.splice(index, 0, firstNode)
  else firstNodes.push(firstNode)
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

  if (nextNode) firstNodes.splice(index, 1)
  else firstNodes.pop()
}

function $clearContent () {
  this.innerHTML = ''
  this[secret.firstNodes] = []
}

function $moveContent (fromIndex, toIndex, extraContext) {
  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
    throw new Error('first and second argument must be numbers')
  }
  if (extraContext !== undefined && typeof extraContext !== 'object') {
    throw new Error('third argument must be an object or undefined')
  }
  const firstNodes = this[secret.firstNodes]
  const fromNode = firstNodes[fromIndex]
  const untilNode = firstNodes[fromIndex + 1]
  const toNode = firstNodes[toIndex]

  let node = fromNode
  let next
  while (node && node !== untilNode) {
    next = node.nextSibling
    this.insertBefore(node, toNode)
    node = next
  }
  firstNodes.splice(fromIndex, 1)
  firstNodes.splice(toIndex, 0, fromNode)

  if (extraContext && fromNode && fromNode.$contextState) {
    Object.assign(fromNode.$contextState, extraContext)
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
