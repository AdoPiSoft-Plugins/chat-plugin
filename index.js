var router = require('./router')
var models = require('./models')
var _require = require('@adopisoft/require')
var app = _require('app')

module.exports = {
  async init () {
    await models.init()
    app.use('/chat-plugin', router)
  }
}
