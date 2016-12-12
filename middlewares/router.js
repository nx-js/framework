'use strict'

const secret = {
  config: Symbol('router config')
}
const rootRouters = new Set()
let cloneId = 0

window.addEventListener('popstate', onPopState, true)

function onPopState (ev) {
  for (let router of rootRouters) {
    routeRouterAndChildren(router, history.state.route)
  }
}

function router (router) {
  if (router.nodeType !== 1) {
    throw new Error('router only works with element nodes')
  }
  setupRouter(router)
  extractViews(router)
  routeRouterAndChildren(router, absoluteToRelativeRoute(router, history.state.route))
}
router.$name = 'router'
module.exports = router

function setupRouter (router) {
  router[secret.config] = {
    children: new Set(),
    templates: new Map()
  }
  const parentRouter = findParentRouter(router)
  if (parentRouter) {
    router.$routerLevel = parentRouter.$routerLevel + 1
    const siblingRouters = parentRouter[secret.config].children
    siblingRouters.add(router)
    router.$cleanup(cleanupRouter, siblingRouters)
  } else {
    router.$routerLevel = 1
    rootRouters.add(router)
    router.$cleanup(cleanupRouter, rootRouters)
  }
}

function cleanupRouter (siblingRouters) {
  siblingRouters.delete(this)
}

function absoluteToRelativeRoute (router, route) {
  return route.slice(router.$routerLevel - 1)
}

function extractViews (router) {
  let child = router.firstChild
  while (child) {
    if (child.nodeType === 1 && child.hasAttribute('route')) {
      const route = child.getAttribute('route')
      router[secret.config].templates.set(route, child)
      if (child.hasAttribute('default-route')) {
        router[secret.config].defaultView = route
      }
      processContent(child)
    }
    child.remove()
    child = router.firstChild
  }
}

function processContent (node) {
  if (node.nodeType === 1) {
    node.setAttribute('clone-id', `router-${cloneId++}`)
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

function findParentRouter (node) {
  node = node.parentNode
  while (node && node.$routerLevel === undefined) {
    node = node.parentNode
  }
  return node
}

function routeRouterAndChildren (router, route) {
  route = route.slice()
  const config = router[secret.config]
  const templates = config.templates
  const defaultView = config.defaultView
  const prevView = router.$currentView
  let nextView = route.shift()

  if (!templates.has(nextView) && templates.has(defaultView)) {
    nextView = defaultView
  }
  if (prevView !== nextView) {
    const eventConfig = {
      bubbles: true,
      cancelable: true,
      detail: {
        from: prevView,
        to: nextView
      }
    }
    const routeEvent = new CustomEvent('route', eventConfig)
    router.dispatchEvent(routeEvent)

    if (!routeEvent.defaultPrevented) {
      routeRouter(router, nextView)
      router.$currentView = nextView
    }
  } else {
    routeChildren(router, route)
  }
}

function routeRouter (router, nextView) {
  router.innerHTML = ''
  const template = router[secret.config].templates.get(nextView)
  if (template) {
    router.appendChild(document.importNode(template, true))
  }
}

function routeChildren (router, route) {
  for (let childRouter of router[secret.config].children) {
    routeRouterAndChildren(childRouter, route)
  }
}
