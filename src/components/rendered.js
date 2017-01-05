'use strict'

const component = require('@nx-js/core')
const middlewares = require('../middlewares')

module.exports = function rendered (config) {
  config = config || {}

  return component(config)
    .use(middlewares.render(config))
}
