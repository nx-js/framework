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
  contentWatcher: Symbol('content watcher'),
  filters: Symbol('filters'),
  limiters: Symbol('limiters')
}
