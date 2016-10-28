'use strict'

const exposed = require('../core/symbols')
const secret = {
  config: Symbol('params sync config')
}
const nodesToSync = new Set()

window.addEventListener('popstate', onPopState)

function onPopState (ev) {
  for (let node of nodesToSync) {
    if (document.body.contains(node)) { // TODO -> refine this a bit! I need a better check
      const state = node[exposed.state]
      const config = node[secret.config]
      syncStateWithParams(state, history.state.params, config)
      syncParamsWithState(history.state.params, state, config, false)
    }
  }
}

module.exports = function paramsFactory (config) {
  function params (node, state, next) {
    node[secret.config] = config
    nodesToSync.add(node)
    node.$cleanup(() => nodesToSync.delete(node))

    syncStateWithParams(state, history.state.params, config)

    next()

    syncParamsWithState(history.state.params, state, config, false)
    node.$observe(() => syncParamsWithState(history.state.params, state, config, true))
  }
  params.$name = 'params'
  return params
}

function syncStateWithParams (state, params, config) {
  for (let paramName in config) {
    const param = params[paramName] || config[paramName].default
    const type = config[paramName].type

    if (config[paramName].required && param === undefined) {
      throw new Error(`${paramName} is a required parameter`)
    }
    if (state[paramName] !== param) {
      if (param === undefined) {
        state[paramName] = undefined
      } else if (type === 'number') {
        state[paramName] = Number(param)
      } else if (type === 'string') {
        state[paramName] = String(param)
      } else if (type === 'boolean') {
        state[paramName] = Boolean(param)
      } else if (type === 'date') {
        state[paramName] = new Date(param)
      } else {
        state[paramName] = param
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
