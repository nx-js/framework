'use strict'

const component = require('@nx-js/core')
const middlewares = require('../middlewares')

module.exports = function page (config) {
  config = config || {}
  config.params = config.params || {}

  return component(config)
    .use(middlewares.render(config))
    .use(middlewares.meta(config))
    .use(middlewares.params(config.params))
}
