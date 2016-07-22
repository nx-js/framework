'use strict'

const core = require('../core')
const middlewares = require('../middlewares')

module.exports = function app (config) {
  return core.component(config)
    .useOnContent(middlewares.events)
    .useOnContent(middlewares.evaluate)
    .useOnContent(middlewares.interpolate)
    .useOnContent(middlewares.attributes)
    .useOnContent(middlewares.content)
    .useOnContent(middlewares.router.ref)
    .useOnContent(middlewares.flow)
    .useOnContent(middlewares.sync)
}
