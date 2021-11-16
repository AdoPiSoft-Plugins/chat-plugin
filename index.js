var router = require('./router')
var models = require('./models')
var { app } = require('@adopisoft/plugin-core')

module.exports = {
  async init () {
    await models.init()
    app.use('/chat-plugin', router)
  }
}
