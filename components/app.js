'use strict'

const {component} = require('../core')
const {evaluate, interpolate, attributes, content, flow, sync, router} = require('../middlewares')

module.exports = function app(config) {
  return component(config)
    .useOnContent(evaluate.expression)
    .useOnContent(interpolate)
    .useOnContent(attributes)
    .useOnContent(content)
    .useOnContent(router.ref)
    .useOnContent(flow)
    .useOnContent(sync)
}
