'use strict'

const component = require('../core')
const middlewares = require('../middlewares')

module.exports = function routerComp (config) {
  return component(config)
    .use(middlewares.router)
}
