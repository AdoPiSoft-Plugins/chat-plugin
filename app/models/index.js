"use strict";
const core_models = require('@adopisoft/core/models')
const {machine} = require('@adopisoft/exports')

var Chat = require("./chat");
var MutedDevice = require("./muted_device");
var model_files = {
  Chat: Chat,
  MutedDevice: MutedDevice
};

exports.init = async() => {
	const {sequelize,models,Sequelize} = await core_models.getInstance()
	const db = await sequelize.getInstance()
	const machine_id = await machine.getId();

  var keys = Object.keys(model_files);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    models[k] = model_files[k](db, Sequelize);
    try {
      await models[k].sync({
        alter: true
      })
    } catch (e) {}
  }
  var default_scope = {
    where: {
      machine_id: machine_id
    }
  };

 models.Chat.addScope("default_scope", default_scope);
 models.Chat.belongsTo(models.MobileDevice);
 models.MobileDevice.hasMany(models.Chat);
 models.MutedDevice.addScope("default_scope", default_scope);
 models.MutedDevice.belongsTo(models.MobileDevice);

 return {sequelize,models,Sequelize}
};