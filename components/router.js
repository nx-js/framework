'use strict'

const core = require('../core')
const middlewares = require('../middlewares')

module.exports = function routerComp (config) {
  return core.component(config)
    .use(middlewares.router)
}
