'use strict'

const {component} = require('../core')
const {router} = require('../middlewares')

module.exports = function routerComp (config) {
  return component(config)
    .use(router.route)
}
