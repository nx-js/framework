'use strict'

module.exports = {
  state: Symbol('state'),
  inheritState: Symbol('inherit state'),
  contextState: Symbol('context state'),
  isolate: Symbol('isolate'),
  middlewares: Symbol('middlewares'),
  contentMiddlewares: Symbol('content middlewares'),
  usedMiddlewareNames: Symbol('used middleware names'),
  cleanupFunctions: Symbol('cleanup functions'),
  lifecycleStage: Symbol('lifecycle stage'),
  root: Symbol('root component'),
  registered: Symbol('registered custom element'),
  filters: Symbol('filters'),
  limiters: Symbol('limiters'),
  routerLevel: Symbol('router level'),
  currentView: Symbol('current router view')
}
