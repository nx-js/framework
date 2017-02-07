'use strict'

const display = require('./display')
const middlewares = require('../middlewares')

module.exports = function control (config) {
  config = config || {}

  return display(config)
    .use(middlewares.params(config.params || {}))
}
