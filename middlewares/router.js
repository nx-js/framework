'use strict'

const symbols = require('../core/symbols')
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

module.exports = function router (router, state, next) {
  if (!(router instanceof Element)) {
    throw new Error('router only works with element nodes')
  }
  router.$using('router')

  setupRouter(router)
  extractViews(router)
  Promise.resolve().then(() =>routeRouterAndChildren(router, absoluteToRelativeRoute(router, history.state.route)))

  return next()
}

function setupRouter (router) {
  router[secret.config] = {
    children: new Set(),
    templates: new Map()
  }

  const parentRouter = findParentRouter(router)
  if (parentRouter) {
    router[symbols.routerLevel] = parentRouter[symbols.routerLevel] + 1
    parentRouter[secret.config].children.add(router)
    router.$cleanup(() => parentRouter[secret.config].children.delete(router))
  } else {
    router[symbols.routerLevel] = 1
    rootRouters.add(router)
    router.$cleanup(() => rootRouters.delete(router))
  }
}

function absoluteToRelativeRoute (router, route) {
  return route.slice(router[symbols.routerLevel] - 1)
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
    router.removeChild(view)
  }
}

function findParentRouter (node) {
  while(node.parentNode) {
    node = node.parentNode
    if (node[symbols.routerLevel] !== undefined) {
      return node
    }
  }
}

function routeRouterAndChildren (router, route) {
  route = route.slice()
  const viewName = route.shift()
  const prevViewName = router[symbols.currentView]
  let routeEvent

  if (prevViewName !== viewName) {
    const eventConfig = {
      bubbles: true,
      cancelable: true,
      detail: {
        from: prevViewName,
        to: viewName,
        params: history.state.params
      }
    }
    routeEvent = new CustomEvent('route', eventConfig)
    router.dispatchEvent(routeEvent)
  }

  if (!(routeEvent && routeEvent.defaultPrevented)) {
    routeRouter(router, viewName)
    Promise.resolve().then(() => routeChildren(router, route))
  }
}

function routeRouter (router, viewName) {
  const templates = router[secret.config].templates
  const defaultView = router[secret.config].defaultView

  if (!templates.has(viewName) && templates.has(defaultView)) {
    viewName = defaultView
  }
  if (router[symbols.currentView] !== viewName) {
    while (router.firstChild) {
      router.removeChild(router.firstChild)
    }
    const template = templates.get(viewName)
    if (template) {
      router.appendChild(document.importNode(template, true))
    }
    router[symbols.currentView] = viewName
  }
}

function routeChildren (router, route) {
  for (let childRouter of router[secret.config].children) {
    routeRouterAndChildren(childRouter, route)
  }
}
