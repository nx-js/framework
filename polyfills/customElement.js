'use strict'

const secret = {
  registered: Symbol('registered')
}

if (!document.registerElement) {
  const registry = new Map()

  const observer = new MutationObserver(onMutations)
  observer.observe(document, {childList: true, subtree: true})

  function onMutations (mutations) {
    for (let mutation of mutations) {
      Array.prototype.forEach.call(mutation.addedNodes, onNodeAdded)
      Array.prototype.forEach.call(mutation.removedNodes, onNodeRemoved)
    }
    mutations = observer.takeRecords()
    if (mutations.length) {
      onMutations(mutations)
    }
  }

  function onNodeAdded (node) {
    if (!(node instanceof Element)) return

    let config = registry.get(node.getAttribute('is'))
    if (!config || config.extends !== node.tagName.toLowerCase()) {
      config = registry.get(node.tagName.toLowerCase())
    }
    if (config && !node[secret.registered]) {
      Object.assign(node, config.prototype)
      node[secret.registered] = true
    }
    if (node[secret.registered] && node.attachedCallback) {
      node.attachedCallback()
    }
    Array.prototype.forEach.call(node.childNodes, onNodeAdded)
  }

  function onNodeRemoved (node) {
    if (node[secret.registered] && node.detachedCallback) {
      node.detachedCallback()
    }
    Array.prototype.forEach.call(node.childNodes, onNodeRemoved)
  }

  document.registerElement = function registerElement (name, config) {
    name = name.toLowerCase()
    if (config.extends) {
      config.extends = config.extends.toLowerCase()
    }
    registry.set(name, config)

    if (config.extends) {
      Array.prototype.forEach.call(document.querySelectorAll(`[is=${name}]`), onNodeAdded)
    } else {
      Array.prototype.forEach.call(document.getElementsByTagName(name), onNodeAdded)
    }
  }

  const originalCreateElement = document.createElement
  document.createElement = function createElement (name, is) {
    const element = originalCreateElement.call(document, name)
    if (is) {
      element.setAttribute('is', is)
    }
    return element
  }
}
