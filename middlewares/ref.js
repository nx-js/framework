'use strict'

const secret = {
  config: Symbol('ref config')
}

updateHistory(pathToRoute(location.pathname), queryToParams(location.search), {history: false})

function ref (elem) {
  if (elem.nodeType !== 1) return

  elem.$route = $route
  if (elem instanceof HTMLAnchorElement) {
    elem.$attribute('iref', irefAttribute)
    elem.$attribute('iref-params', irefParamsAttribute)
    elem.$attribute('iref-options', irefOptionsAttribute)
  }
}
ref.$name = 'ref'
ref.$require = ['attributes']
module.exports = ref

function irefAttribute (path) {
  this[secret.config] = this[secret.config] || {}
  const config = this[secret.config]
  config.path = path

  let route = pathToRoute(path)
  route = route.some(filterRelativeTokens) ? relativeToAbsoluteRoute(this, route) : route
  const href =  routeToPath(route) + (this.search || '')
  this.setAttribute('href', href)
  this.addEventListener('click', onClick, true)
}

function irefParamsAttribute (params) {
  this[secret.config] = this[secret.config] || {}
  const config = this[secret.config]
  config.params = params

  const href = (this.pathname || '') + paramsToQuery(params)
  this.setAttribute('href', href)
  this.addEventListener('click', onClick, true)
}

function onClick (ev) {
  const config = this[secret.config]
  if (config) {
    this.$route(config.path, config.params, config.options)
    ev.preventDefault()
  }
}

function irefOptionsAttribute (options) {
  this[secret.config] = this[secret.config] || {}
  this[secret.config].options = options
}

function $route (path, params, options) {
  if (params === undefined) {
    params = {}
  }
  if (options === undefined) {
    options = {}
  }
  let route = pathToRoute(path)
  if (route.some(filterRelativeTokens)) {
    route = relativeToAbsoluteRoute(this, route)
  }
  updateHistory(route, params, options)
  window.scroll(0, 0)
}

function relativeToAbsoluteRoute (node, relativeRoute) {
  let router = findParentRouter(node)
  let routerLevel = router ? router.$routerLevel : 0

  for (let token of relativeRoute) {
    if (token === '..') routerLevel--
  }
  if (routerLevel < 0) {
    throw new Error('invalid relative route')
  }

  const currentRoute = []
  while (router) {
    currentRoute.unshift(router.$currentView)
    router = findParentRouter(router)
  }
  const route = relativeRoute.filter(filterAbsoluteTokens)
  return currentRoute.slice(0, routerLevel).concat(route)
}

function filterAbsoluteTokens (token) {
  return (token !== '..' && token !== '.')
}

function filterRelativeTokens (token) {
  return (token === '..' || token === '.')
}

function filterEmptyTokens (token) {
  return (token !== '')
}

function findParentRouter (node) {
  while(node.parentNode) {
    node = node.parentNode
    if (node.$routerLevel !== undefined) {
      return node
    }
  }
}

function updateHistory (route, params, options) {
  if (options.inherit) {
    params = Object.assign({}, history.state.params, params)
  }

  const url = routeToPath(route) + paramsToQuery(params)
  if (options.history === false) {
    history.replaceState({route, params}, '', url)
  } else {
    history.pushState({route, params}, '', url)
  }

  const eventConfig = {bubbles: true, cancelable: false }
  document.dispatchEvent(new Event('popstate', eventConfig))
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
  return path.split('/').filter(filterEmptyTokens)
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
