
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./op-resolver-gateway.cjs.production.min.js')
} else {
  module.exports = require('./op-resolver-gateway.cjs.development.js')
}
