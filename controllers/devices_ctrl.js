'use strict'
var core = require('../../core')
var default_per_page = 20

exports.get = async (req, res, next) => {
  try{
    var { dbi } = core
    var { page, q, per_page } = req.query
    if (!per_page) per_page = default_per_page
    if (!page) page = 1

    var limit = parseInt(per_page)
    var offset = (page - 1) * limit
    var { Op } = dbi.Sequelize

    var search_q = q
    var where = {}
    if (search_q) {
      where[Op.or] = [
        {
          hostname: {
            [Op.like]: `%${search_q}%`
          }
        },
        {
          mac_address: {
            [Op.like]: `%${search_q}%`
          }
        },
        {
          ip_address: {
            [Op.like]: `%${search_q}%`
          }
        }
      ]
      var statuses = ['connected', 'disconnected']
      if(statuses.includes(search_q)){
        where[Op.or].push(
          {
            status: {
              [Op.eq]: search_q
            }
          }
        )
      }
    }

    var result = await dbi.models.MobileDevice.scope(['default_scope']).findAndCountAll({
      distinct: true,
      where, limit, offset,
      include: [{
        model: dbi.models.Chat,
      }],
      order: [['Chats','created_at', 'DESC NULLS LAST'], ['active', 'DESC']]
    })

    var devices = result.rows.map( (r)=>{
      var d = new core.classes.MobileDevice(r)
      return d
    })

    res.json({
      devices: devices,
      count: devices.length,
      total_count: result.count
    })
  }catch(e){
    next(e)
  }
}

exports.getDeviceData = async(req, res, next)=>{
  try{
    var { mobile_device_id } = req.params
    var is_muted = !!(await core.dbi.models.MutedDevice.findOne({ where: { mobile_device_id } }))
    var device = await core.devices_manager.loadDevice(mobile_device_id)
    res.json(Object.assign(device.toJSON(), { is_muted }))
  }catch(e){
    next(e)
  }
}

exports.muteDevice = async(req, res, next)=>{
  try{
    var { mobile_device_id } = req.params
    var device = await core.devices_manager.loadDevice(mobile_device_id)
    await core.dbi.models.MutedDevice.create({
      machine_id: core.machine_id,
      mobile_device_id,
      muted_at: new Date()
    })
    device.emit("chat:mute")
    res.json({})
  }catch(e){
    next(e)
  }
}

exports.unmuteDevice = async(req, res, next)=>{
  try{
    var { mobile_device_id } = req.params
    var device = await core.devices_manager.loadDevice(mobile_device_id)
    await core.dbi.models.MutedDevice.destroy({
      where: { mobile_device_id }
    })
    device.emit("chat:unmute")
    res.json({})
  }catch(e){
    next(e)
  }
}
