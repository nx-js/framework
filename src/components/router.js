'use strict'

const component = require('@nx-js/core')
const middlewares = require('../middlewares')

module.exports = function routerComp (config) {
  return component(config)
    .use(middlewares.route)
}
