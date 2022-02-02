var router = require("./router.js");
var models = require("./models");
var { app } = require('@adopisoft/exports');

module.exports = {
  async init() {
    await models.init();
    app.use(router)
  },
  uninstall() {}
};