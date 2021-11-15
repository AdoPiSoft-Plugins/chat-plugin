var router = require('./router')
var models = require('./models')
var { app } = require('@adopisoft/plugin-core')
var { name } = require('./package.json')

module.exports = {
  async init () {
    await models.init()
    app.use(name, router)
  }
}
