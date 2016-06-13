'use strict'

module.exports = {
  state: Symbol('state'),
  inheritState: Symbol('inheritState'),
  contextState: Symbol('contextState'),
  isolate: Symbol('isolate'),
  middlewares: Symbol('middlewares'),
  contentMiddlewares: Symbol('contentMiddlewares'),
  usedMiddlewareNames: Symbol('usedMiddlewareNames'),
  cleanupFunctions: Symbol('cleanupFunctions'),
  lifecycleStage: Symbol('lifecycleStage'),
  contentWatcher: Symbol('contentWatcher')
}
