var _require = require('@adopisoft/require')
var dbi = _require('core/dbi')
var machine_id = _require('core/machine_id')
var Chat = require('./chat')
var MutedDevice = require('./muted_device')

var model_files = {
  Chat,
  MutedDevice
}

exports.init = async () => {
  var { sequelize, Sequelize } = dbi
  var db = await sequelize.getInstance()

  var keys = Object.keys(model_files)
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i]
    dbi.models[k] = model_files[k](db, Sequelize)
  }

  var default_scope = {
    where: { machine_id }
  }

  dbi.models.Chat.addScope('default_scope', default_scope)
  dbi.models.Chat.belongsTo(dbi.models.MobileDevice)
  dbi.models.MobileDevice.hasMany(dbi.models.Chat)
  dbi.models.MutedDevice.addScope('default_scope', default_scope)
  dbi.models.MutedDevice.belongsTo(dbi.models.MobileDevice)

  return dbi
}
