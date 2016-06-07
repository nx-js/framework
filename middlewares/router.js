'use strict'

const ROUTER_DATA = Symbol('ROUTER DATA')
const REF_DATA = Symbol('REF DATA')
const PARAMS_DATA = Symbol('PARAMS DATA')

let currentRoute = [], currentParams = {}
const rootRouters = new Set()
const syncComps = new Set()

// the problem is that window eventlistener is added as soon as this module is required, it should not be added if I dont want to use the router
window.addEventListener('popstate', (ev) => {
  updateHistory(ev.state.route, ev.state.params, {history: false})
  transitionToRouteFromRoot(ev.state.route)
})
updateHistory(pathToRoute(location.pathname), queryToParams(location.search), {history: false})

module.exports = {
  route,
  params,
  ref,
}

function route (router, state, next) {
  if (!(router instanceof Element)) return next()
  router.$using('router-route')

  setupRouter(router)
  extractViews(router)

  next()

  transitionToRoute(router, absoluteToRelativeRoute(router, currentRoute))
}

function setupRouter (router) {
  router[ROUTER_DATA] = {
    children: new Set(),
    templates: new Map()
  }

  const parentRouter = findParentRouter(router)
  if (parentRouter) {
    router[ROUTER_DATA].depth = parentRouter[ROUTER_DATA].depth + 1
    parentRouter[ROUTER_DATA].children.add(router)
    router.$cleanup(() => parentRouter[ROUTER_DATA].children.delete(router))
  } else {
    router[ROUTER_DATA].depth = 0
    rootRouters.add(router)
    router.$cleanup(() => rootRouters.delete(router))
  }
}

function extractViews (router) {
  let node = router.firstChild
  while (node) {
    if (node instanceof Element && node.hasAttribute('nx-route')) {
      if (node.hasAttribute('nx-default-route')) {
        router[ROUTER_DATA].defaultView = node.getAttribute('nx-route')
        router.removeAttribute('nx-default-route')
      }

      router[ROUTER_DATA].templates.set(node.getAttribute('nx-route'), node)
      node.removeAttribute('nx-route')
    }
    router.removeChild(node)
    node = router.firstChild
  }
}

function findParentRouter (node) {
  while(node.parentNode) {
    node = node.parentNode
    if (node[ROUTER_DATA]) return node
  }
}

function transitionToRoute (router, route) {
  const routerData = router[ROUTER_DATA]
  const viewName = route[routerData.depth] || routerData.defaultView

  if (routerData.currentView !== viewName) {
    const routerChangeEventSettings = {
      cancelable: true,
      bubbles: true,
      detail: {from: routerData.currentView, to: viewName}
    }
    const routeChangeEvent = new CustomEvent('route-change', routerChangeEventSettings)
    router.dispatchEvent(routeChangeEvent)
    if (!routeChangeEvent.defaultPrevented) switchView(router, viewName)
  }

  for (let childRouter of routerData.children) {
    transitionToRoute(childRouter, route)
  }
}

function transitionToRouteFromRoot (route) {
  for (let router of rootRouters) {
    transitionToRoute(router, route)
  }
}

function switchView (router, viewName) {
  while (router.firstChild) {
    router.removeChild(router.firstChild)
  }

  const routerData = router[ROUTER_DATA]
  const template = routerData.templates.get(viewName)
  if (template) router.appendChild(document.importNode(template, true))

  routerData.currentView = viewName
}

function updateHistory (route, params, options) {
  if (options.inherit) Object.assign(currentParams, params)
  else currentParams = params
  currentRoute = route

  const url = routeToPath(currentRoute) + paramsToQuery(currentParams)
  const historyState = {route: currentRoute, params: currentParams}

  if (options.history === false) history.replaceState(historyState, '', url)
  else history.pushState(historyState, '', url)

  for (let comp of syncComps) { // TODO rename these
    syncStateWithParams(comp[PARAMS_DATA].state, comp[PARAMS_DATA].config)
  }
}

function ref (elem, state, next) {
  if (!(elem instanceof Element)) return next()
  elem.$require('attributes')
  elem.$using('router-ref')

  elem[REF_DATA] = {}
  elem.$go = $go

  if (elem.hasAttribute('nx-ref')) {
    elem.$attribute('nx-ref-options', (options) => elem[REF_DATA].options = options)
    elem.$attribute('nx-ref-params', (params) => elem[REF_DATA].params = params)
    elem.addEventListener('click', onRefClick)
  }
  return next()
}

function onRefClick (ev) {
  this.$go(this.getAttribute('nx-ref'), this[REF_DATA].params, this[REF_DATA].options)
}

function $go (route, params = {}, options = {}) {
  const relative = route.charAt(0) === '/'

  if (relative) route = route.slice(1)
  route = route.split('/')

  const parentRouter = findParentRouter(this)
  if (relative && parentRouter) {
    for (let childRouter of parentRouter[ROUTER_DATA].children) {
      transitionToRoute(childRouter, route)
    }
    updateHistory(relativeToAbsoluteRoute(parentRouter, route), params, options)
  } else {
    transitionToRouteFromRoot(route)
    updateHistory(route, params, options)
  }
}

function params (config) {
  return function $sync (node, state, next) {
    node.$using('router-params')

    syncComps.add(node)
    node.$cleanup(() => syncComps.delete(node))
    node[PARAMS_DATA] = {config, state}

    syncStateWithParams(state, config)
    node.$observe(() => syncParamsWithState(config, state))

    return next()
  }
}

function syncStateWithParams (state, config) {
  for (let paramName in config) {
    if (state[paramName] !== currentParams[paramName]) {
      if (config[paramName].type === 'number') state[paramName] = Number(currentParams[paramName])
      else if (config[paramName].type === 'string') state[paramName] = String(currentParams[paramName])
      else if (config[paramName].type === 'boolean') state[paramName] = Boolean(currentParams[paramName])
      else state[paramName] = currentParams[paramName]
    }
  }
}

function syncParamsWithState (config, state) {
  let newParams = {}, changeHappened = false, history = false

  for (let paramName in config) {
    if (currentParams[paramName] !== state[paramName]) {
      if (config[paramName].readOnly) throw new Error(`${paramName} is readOnly`)
      if (state[paramName] !== undefined && config[paramName].type && config[paramName].type !== (typeof state[paramName])) {
        throw new Error(`${paramName} is of bad type, type is ${typeof state[paramName]}, should be ${config[paramName].type}`)
      }

      newParams[paramName] = state[paramName] // throw if bad type
      changeHappened = true
      if (config[paramName].history) history = true
    }
  }
  if (changeHappened) {
    updateHistory(currentRoute, newParams, {history, inherit: true})
  }
}

// problem -> I have to add 1 to depth
// because it takes a router and routes relative to it
// think about this!
function relativeToAbsoluteRoute (router, route) {
  return currentRoute.slice(0, router[ROUTER_DATA].depth + 1).concat(route)
}

function absoluteToRelativeRoute (router, route) {
  return route.slice(router[ROUTER_DATA].depth)
}

function routeToPath (route = []) {
  return '/' + route.join('/')
}

function pathToRoute (path) {
  if (path.charAt(0) === '/') path = path.slice(1)
  return path.split('/')
}

function paramsToQuery (params = {}) {
  let query = ''
  for (let param in params) {
    if (params[param] !== undefined) query += `${param}=${params[param]}&`
  }
  if (query !== '') query = '?' + query.slice(0, -1)
  return query
}

function queryToParams (query) {
  if (query.charAt(0) === '?') query = query.slice(1)
  query = query.split('&')

  const params = {}
  for (let keyValue of query) {
    keyValue = keyValue.split('=')
    if (keyValue.length === 2) params[keyValue[0]] = keyValue[1]
  }
  return params
}
