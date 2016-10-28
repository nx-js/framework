'use strict'

module.exports = {
  state: Symbol('state'),
  inheritState: Symbol('inherit state'),
  contextState: Symbol('context state'),
  isolate: Symbol('isolate'),
  middlewares: Symbol('middlewares'),
  contentMiddlewares: Symbol('content middlewares'),
  cleanupFunctions: Symbol('cleanup functions'),
  lifecycleStage: Symbol('lifecycle stage'),
  root: Symbol('root component'),
  registered: Symbol('registered custom element'),
  routerLevel: Symbol('router level'),
  currentView: Symbol('current router view')
}
