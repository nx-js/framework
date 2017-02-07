'use strict'

const rendered = require('./rendered')
const middlewares = require('../middlewares')

module.exports = function display (config) {
  config = config || {}

  return rendered(config)
    .use(middlewares.props.apply(null, config.props || []))
}
