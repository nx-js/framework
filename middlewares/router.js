'use strict'

const routerConfig = Symbol('routerConfig')
const refConfig = Symbol('refConfig')

let currentRoute = []
let currentParams = {}
const rootRouters = new Set()
const statesToSync = new Set()

updateHistory(pathToRoute(location.pathname), queryToParams(location.search), {history: false})
window.addEventListener('popstate', onPopState)
window.addEventListener('click', onClick)

function onPopState (ev) {
  updateHistory(ev.state.route, ev.state.params, {history: false})
  for (let router of rootRouters) {
    routeRouterAndChildren(router, ev.state.route)
  }
}

function onClick (ev) {
  const route = ev.target.getAttribute('nx-ref')
  if (route && ev.target[refConfig]) {
    ev.target.$routeTo(route, ev.target[refConfig].params, ev.target[refConfig].options)
    ev.preventDefault()
  }
}

module.exports = {
  route,
  params,
  ref,
}

function route (router, state, next) {
  if (!(router instanceof Element)) {
    return next()
  }
  router.$using('router-route')

  setupRouter(router)
  extractViews(router)
  next()
  routeRouterAndChildren(router, absoluteToRelativeRoute(router, currentRoute))
}

function setupRouter (router) {
  router[routerConfig] = {
    children: new Set(),
    templates: new Map()
  }

  const parentRouter = findParentRouter(router)
  if (parentRouter) {
    router[routerConfig].depth = parentRouter[routerConfig].depth + 1
    parentRouter[routerConfig].children.add(router)
    router.$cleanup(() => parentRouter[routerConfig].children.delete(router))
  } else {
    router[routerConfig].depth = 0
    rootRouters.add(router)
    router.$cleanup(() => rootRouters.delete(router))
  }
}

function extractViews (router) {
  let view
  while (router.firstChild) {
    view = router.firstChild
    if (view instanceof Element && view.hasAttribute('nx-route')) {
      router[routerConfig].templates.set(view.getAttribute('nx-route'), view)
      if (view.hasAttribute('nx-default-route')) {
        router[routerConfig].defaultView = view.getAttribute('nx-route')
      }
    }
    router.removeChild(view)
  }
}

function findParentRouter (node) {
  while(node.parentNode) {
    node = node.parentNode
    if (node[routerConfig]) {
      return node
    }
  }
}

function routeRouterAndChildren (router, route) {
  route = route.slice()
  const viewName = route.shift()

  routeRouter(router, viewName)
  Promise.resolve().then(() => routeChildren(router, route))
}

function routeRouter (router, viewName) {
  const templates = router[routerConfig].templates
  const defaultView = router[routerConfig].defaultView

  if (!templates.has(viewName) && templates.has(defaultView)) {
    viewName = defaultView
  }
  if (router[routerConfig].currentView !== viewName) {
    while (router.firstChild) {
      router.removeChild(router.firstChild)
    }
    router.appendChild(document.importNode(templates.get(viewName), true))
    router[routerConfig].currentView = viewName
  }
}

function routeChildren (router, route) {
  for (let childRouter of router[routerConfig].children) {
    routeRouterAndChildren(childRouter, route)
  }
}

function updateHistory (route, params, options) {
  if (options.inherit) {
    Object.assign(currentParams, params)
  } else {
    currentParams = params
  }
  currentRoute = route

  const url = routeToPath(currentRoute) + paramsToQuery(currentParams)
  const historyItem = {route: currentRoute, params: currentParams}
  if (options.history === false) {
    history.replaceState(historyItem, '', url)
  } else {
    history.pushState(historyItem, '', url)
  }

  for (let stateToSync of statesToSync) {
    syncStateWithParams(stateToSync.state, stateToSync.config)
  }
}

function ref (elem, state, next) {
  if (!(elem instanceof Element)) {
    return next()
  }
  elem.$require('attributes')
  elem.$using('router-ref')

  elem.$routeTo = $routeTo

  if (elem.hasAttribute('nx-ref')) {
    elem[refConfig] = {}
    elem.$attribute('nx-ref-options', (options) => elem[refConfig].options = options)
    elem.$attribute('nx-ref-params', (params) => elem[refConfig].params = params)

    let path = elem.getAttribute('nx-ref')
    const relative = path.charAt(0) === '/'
    if (relative) {
      path = path.slice(1)
    }
    let route = path.split('/')
    if (relative) {
      route = relativeToAbsoluteRoute(findParentRouter(elem), route)
    }
    Promise.resolve().then(() => {
      const href = routeToPath(route) + paramsToQuery(elem[refConfig].params)
      elem.setAttribute('href', href)
    })
  }
  return next()
}

function $routeTo (path, params, options) {
  if (params === undefined) {
    params = {}
  }
  if (options === undefined) {
    options = {}
  }

  const relative = path.charAt(0) === '/'
  if (relative) {
    path = path.slice(1)
  }
  const route = path.split('/')

  const parentRouter = findParentRouter(this)
  if (relative && parentRouter) {
    for (let siblingRouter of parentRouter[routerConfig].children) {
      routeRouterAndChildren(siblingRouter, route)
    }
    updateHistory(relativeToAbsoluteRoute(parentRouter, route), params, options)
  } else {
    for (let rootRouter of rootRouters) {
      routeRouterAndChildren(rootRouter, route)
    }
    updateHistory(route, params, options)
  }
  window.scrollTo(0, 0)
}

function params (config) {
  return function paramsMiddleware (node, state, next) {
    node.$using('router-params')

    const stateToSync = {state, config}
    statesToSync.add(stateToSync)
    node.$cleanup(() => statesToSync.delete(stateToSync))
    syncStateWithParams(state, config)
    node.$observe(() => syncParamsWithState(config, state))
    return next()
  }
}

function syncStateWithParams (state, config) {
  for (let paramName in config) {
    if (state[paramName] !== currentParams[paramName]) {
      if (config[paramName].type === 'number') {
        state[paramName] = Number(currentParams[paramName])
      } else if (config[paramName].type === 'string') {
        state[paramName] = String(currentParams[paramName])
      } else if (config[paramName].type === 'boolean') {
        state[paramName] = Boolean(currentParams[paramName])
      } else {
        state[paramName] = currentParams[paramName]
      }
    }
  }
}

function syncParamsWithState (config, state) {
  let newParams = {}
  let paramsChanged = false
  let historyChanged = false

  for (let paramName in config) {
    if (currentParams[paramName] !== state[paramName]) {
      if (config[paramName].readOnly) {
        throw new Error(`${paramName} is readOnly`)
      }
      if (state[paramName] !== undefined && config[paramName].type !== (typeof state[paramName])) {
        throw new Error(`${paramName} is of bad type, type is ${typeof state[paramName]}, should be ${config[paramName].type}`)
      }
      newParams[paramName] = state[paramName]
      paramsChanged = true
      if (config[paramName].history) {
        historyChanged = true
      }
    }
  }
  if (paramsChanged) {
    updateHistory(currentRoute, newParams, {history: historyChanged, inherit: true})
  }
}

function relativeToAbsoluteRoute (router, route) {
  return currentRoute.slice(0, router[routerConfig].depth + 1).concat(route)
}

function absoluteToRelativeRoute (router, route) {
  return route.slice(router[routerConfig].depth)
}

function routeToPath (route) {
  if (route === undefined) {
    route = []
  }
  return '/' + route.join('/')
}

function pathToRoute (path) {
  if (path.charAt(0) === '/') {
    path = path.slice(1)
  }
  return path.split('/')
}

function paramsToQuery (params) {
  if (params === undefined) {
    params = {}
  }

  let query = ''
  for (let param in params) {
    if (params[param] !== undefined) {
      query += `${param}=${params[param]}&`
    }
  }
  if (query !== '') {
    query = '?' + query.slice(0, -1)
  }
  return query
}

function queryToParams (query) {
  if (query.charAt(0) === '?') {
    query = query.slice(1)
  }
  query = query.split('&')

  const params = {}
  for (let keyValue of query) {
    keyValue = keyValue.split('=')
    if (keyValue.length === 2) {
      params[keyValue[0]] = keyValue[1]
    }
  }
  return params
}
