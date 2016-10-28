'use strict'

const core = require('../core')
const middlewares = require('../middlewares')

module.exports = function app (config) {
  config = Object.assign({root: true}, config)

  return core.component(config)
    .useOnContent(middlewares.code)
    .useOnContent(middlewares.expression)
    .useOnContent(middlewares.interpolate)
    .useOnContent(middlewares.attributes)
    .useOnContent(middlewares.style)
    .useOnContent(middlewares.animate)
    .useOnContent(middlewares.ref)
    .useOnContent(middlewares.content)
    .useOnContent(middlewares.flow)
    .useOnContent(middlewares.bindable)
    .useOnContent(middlewares.bind)
    .useOnContent(middlewares.events)
}
