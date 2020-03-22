'use strict'
var router = require("./router")
var models = require("./models")
var { app } = require('../core')

module.exports = {
  async init(){
    await models.init()
    app.use(router)
  },
  uninstall(){}
}
