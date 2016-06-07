'use strict'

module.exports = {
  state: Symbol('state'),
  inheritState: Symbol('inheritState'),
  contextState: Symbol('contextState'),
  middlewares: Symbol('middlewares'),
  childrenMiddlewares: Symbol('childrenMiddlewares'),
  isolateMiddlewares: Symbol('isolateMiddlewares'),
  usedMiddlewareNames: Symbol('usedMiddlewareNames'),
  cleanupFunctions: Symbol('cleanupFunctions'),
  lifecycleStage: Symbol('lifecycleStage'),
  contentWatcher: Symbol('contentWatcher')
}
