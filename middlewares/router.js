'use strict'

const secret = {
  config: Symbol('router config')
}
const rootRouters = new Set()

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
router.$require = ['cleanup']
module.exports = router

function setupRouter (router) {
  router[secret.config] = {
    children: new Set(),
    templates: new Map()
  }
  const parentRouter = findParentRouter(router)
  if (parentRouter) {
    router.$routerLevel = parentRouter.$routerLevel + 1
    parentRouter[secret.config].children.add(router)
    router.$cleanup(() => parentRouter[secret.config].children.delete(router))
  } else {
    router.$routerLevel = 1
    rootRouters.add(router)
    router.$cleanup(() => rootRouters.delete(router))
  }
}

function absoluteToRelativeRoute (router, route) {
  return route.slice(router.$routerLevel - 1)
}

function extractViews (router) {
  let view
  while (router.firstChild) {
    view = router.firstChild
    if (view instanceof Element && view.hasAttribute('route')) {
      router[secret.config].templates.set(view.getAttribute('route'), view)
      if (view.hasAttribute('default-route')) {
        router[secret.config].defaultView = view.getAttribute('route')
      }
    }
    view.remove()
  }
}

function findParentRouter (node) {
  while (node.parentNode) {
    node = node.parentNode
    if (node.$routerLevel !== undefined) {
      return node
    }
  }
}

function routeRouterAndChildren (router, route) {
  route = route.slice()
  const templates = router[secret.config].templates
  const defaultView = router[secret.config].defaultView
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
  const template = router[secret.config].templates.get(nextView)

  while (router.firstChild) {
    router.firstChild.remove()
  }
  if (template) {
    router.appendChild(document.importNode(template, true))
  }
}

function routeChildren (router, route) {
  for (let childRouter of router[secret.config].children) {
    routeRouterAndChildren(childRouter, route)
  }
}
