'use strict'

module.exports = function delay (next, context, time) {
  if (time === undefined || isNaN(time)) {
    time = 200
  }
  setTimeout(next, time)
}
