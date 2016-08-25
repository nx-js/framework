'use strict'

const secret = {
  state: Symbol('params sync state'),
  config: Symbol('params sync config')
}
const nodesToSync = new Set()

window.addEventListener('popstate', onPopState)

function onPopState (ev) {
  for (let node of nodesToSync) {
    syncStateWithParams(node[secret.state], history.state.params, node[secret.config])
  }
}

module.exports = function params (config) {
  return function paramsMiddleware (node, state, next) {
    node.$using('params')

    node[secret.state] = state
    node[secret.config] = config
    nodesToSync.add(node)
    node.$cleanup(() => nodesToSync.delete(node))

    syncStateWithParams(state, history.state.params, config)

    next()

    syncParamsWithState(history.state.params, state, config, false)
    node.$observe(() => syncParamsWithState(history.state.params, state, config, true))
  }
}

function syncStateWithParams (state, params, config) {
  for (let paramName in config) {
    if (state[paramName] !== params[paramName]) {
      if (params[paramName] === undefined) {
        state[paramName] = undefined
      } else if (config[paramName].type === 'number') {
        state[paramName] = Number(params[paramName])
      } else if (config[paramName].type === 'string') {
        state[paramName] = String(params[paramName])
      } else if (config[paramName].type === 'boolean') {
        state[paramName] = Boolean(params[paramName])
      } else if (config[paramName].type === 'date') {
        state[paramName] = new Date(params[paramName])
      } else {
        state[paramName] = params[paramName]
      }
    }
  }
}

function syncParamsWithState (params, state, config, shouldUpdateHistory) {
  let newParams = {}
  let paramsChanged = false
  let historyChanged = false

  for (let paramName in config) {
    if (params[paramName] !== state[paramName]) {
      if (config[paramName].readOnly) {
        throw new Error(`${paramName} is readOnly`)
      }
      newParams[paramName] = state[paramName]
      paramsChanged = true
      if (config[paramName].history && shouldUpdateHistory) {
        historyChanged = true
      }
    }
  }
  if (paramsChanged) {
    updateHistory(newParams, historyChanged)
  }
}

function updateHistory (params, historyChanged) {
  params = Object.assign({}, history.state.params, params)

  const url = location.pathname + paramsToQuery(params)
  if (historyChanged) {
    history.pushState({route: history.state.route, params}, '', url)
  } else {
    history.replaceState({route: history.state.route, params}, '', url)
  }
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
