'use strict'
var core = require('../../core')
var notification = require("../store/notification")
var { admin_socket, machine_id } = core
var default_per_page = 8

exports.getClientMessages = async (req, res, next) => {
  try{
    var { mobile_device_id } = req.params
    var { page, per_page } = req.query
    per_page = !isNaN(per_page)? parseInt(per_page) : default_per_page
    page = !isNaN(page)? parseInt(page) : 1
    var offset = (page - 1) * per_page
    var order = [['created_at', 'DESC']]
    var where = { mobile_device_id }
    var result = await core.dbi.models.Chat.findAndCountAll({ where, limit: per_page, offset, order })
    res.json({
      chats: result.rows,
      count: result.rows.length,
      total_count: result.count
    })
  }catch(e){
    next(e)
  }
}

exports.sendToClient = async(req, res, next)=>{
  try{
    var { params, body, query } = req
    Object.assign(params, body, query)
    var { mobile_device_id } = params
    var device_db_instance = await core.dbi.models.MobileDevice.findByPk(mobile_device_id) || {}
    var admin = req.account
    var chat = await core.dbi.models.Chat.create({
      machine_id,
      mobile_device_id,
      admin_username: admin.username,
      message: params.message,
      sender_id: admin.username,
      is_read_by_admin: true,
      is_read_by_user: false
    })
    var device = await core.devices_manager.findByMAC(device_db_instance.mac_address)
    if(device){
      device.emit("chat", chat)
      notification.add(device_db_instance.id, {title: "Message", content: `Admin: ${chat.message}`})
    }
    admin_socket.emitAdmin('chat', chat)

    res.json(chat)
  }catch(e){
    next(e)
  }
}

exports.bulkSendToClients = async(req, res, next)=>{
  try{
    var { params, body, query } = req
    Object.assign(params, body, query)
    var admin = req.account
    var clients = core.devices_manager.list
    if(!clients || clients.length <= 0)
      return next("Sending aborted, you have no online customers as of the moment.")

    for(var i = 0; i < clients.length; i++){
      var device = clients[i]
      var mobile_device_id = device.db_instance.id
      var chat = await core.dbi.models.Chat.create({
        mobile_device_id,
        admin_username: admin.username,
        message: params.message,
        sender_id: admin.username,
        is_read_by_admin: true,
        is_read_by_user: false
      })
      device.emit("chat", chat)
      admin_socket.emitAdmin('chat', chat)
    }
    res.json({success: true})
  }catch(e){
    next(e)
  }
}

exports.getMessages = async(req, res, next)=>{
  var { device } = req
  try{
    var mobile_device_id = device.db_instance.id
    var { page, per_page } = req.query
    per_page = !isNaN(per_page)? parseInt(per_page) : default_per_page
    page = !isNaN(page)? parseInt(page) : 1
    var offset = (page - 1) * per_page
    var order = [['created_at', 'DESC']]
    var where = { mobile_device_id }
    var result = await core.dbi.models.Chat.findAndCountAll({ where, limit: per_page, offset, order })

    var is_muted = !!(await core.dbi.models.MutedDevice.findOne({ where }))
    res.json({
      is_muted,
      chats: result.rows,
      count: result.rows.length,
      total_count: result.count
    })
  }catch(e){
    next(e)
  }
}

exports.sendMessage = async(req, res, next)=>{
  try{
    var { params, body, query, device } = req
    Object.assign(params, body, query)
    var mobile_device_id = device.db_instance.id

    var is_muted = !!(await core.dbi.models.MutedDevice.findOne({ where: { mobile_device_id } }))
    if(is_muted) return next("You don't have permission to send message.")

    var { admin_username, message } = params
    if(!admin_username){
      var admins = await core.accounts.getAll()
      admin_username = admins[0].username
    }
    var chat = await core.dbi.models.Chat.create({
      machine_id,
      mobile_device_id,
      admin_username,
      message,
      sender_id: mobile_device_id,
      is_read_by_admin: false,
      is_read_by_user: true,
    })
    device.emit("chat", chat)
    admin_socket.emitAdmin('chat', chat)
    res.json({success: true})
  }catch(e){
    next(e)
  }
}

exports.readClientMessages = async(req, res, next)=>{
  var { mobile_device_id } = req.params
  try{
    var where = {mobile_device_id}
    var result = await core.dbi.models.Chat.update({is_read_by_admin: true}, { where})
    res.json({})
  }catch(e){
    next(e)
  }
}

exports.readAdminMessages = async(req, res, next)=>{
  var { device } = req
  try{
    var mobile_device_id = device.db_instance.id
    var where = {mobile_device_id}
    var result = await core.dbi.models.Chat.update({is_read_by_user: true}, { where })
    res.json({})
  }catch(e){
    next(e)
  }
}

exports.deleteConversation = async(req, res, next)=>{
  try{
    var { params, body, query } = req
    Object.assign(params, body, query)
    var { mobile_device_id } = params
    var where = { mobile_device_id }
    await core.dbi.models.Chat.destroy({ where })
    res.json({success: true})
  }catch(e){
    next(e)
  }
}
