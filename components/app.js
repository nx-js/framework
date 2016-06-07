'use strict'

const {component} = require('../core')
const {evaluate, interpolate, attributes, content, flow, sync, router} = require('../middlewares')

module.exports = function app(config) {
  return component(config)
    .useOnChildren(evaluate.expression)
    .useOnChildren(interpolate)
    .useOnChildren(attributes)
    .useOnChildren(content)
    .useOnChildren(router.ref)
    .useOnChildren(flow)
    .useOnChildren(sync)
}
