"use strict";
const path = require("path");
const util = require("util");
const fs = require("fs");
const notification = require("../store/notification");
const db = require('@adopisoft/core/models')
const {machine,devices_manager } = require('@adopisoft/exports')
const socket_factory = require('@adopisoft/core/utils/socket-factory.js')
const accounts = require('@adopisoft/core/accounts.js')

const config = require("../config.js");
const default_per_page = 8;

exports.getSettings = async(req, res, next) => {
  try {
    const cfg = await config.read()
    const icon = await config.getIcon()
    res.json({config: cfg, icon_filename: icon})
  } catch (e) {
    next(e)
  }
};
exports.updateSettings = async(req, res, next) => {
  try {
    await config.save(req.body)
    res.json({})
  } catch (e) {
    next(e)
  }
};

exports.uploadIcon = async (req,res,next) => {
  try{
    if(!req.files) return 'File is Empty'
    const {file} = req.files
    const f = await config.saveIcon(file)
    res.send({icon_filename: f});
  }catch(e){
    next(e)
  }
}

exports.restoreDefaultIcon = async (req,res,next) => {
  try{
    const icon = await config.restoreIcon()
    res.json({icon_filename: icon})
  }catch(e){
    next(e)
  }
}

exports.getClientMessages = async(req, res, next) => {
  try {
    const dbi = await db.getInstance()
    const {
      mobile_device_id
    } = req.params;
    var {
      page,
      per_page
    } = req.query;
    per_page = !isNaN(per_page) ? parseInt(per_page) : default_per_page;
    page = !isNaN(page) ? parseInt(page) : 1;
    const offset = (page - 1) * per_page;
    const order = [
      ["created_at", "DESC"]
    ];
    const where = {
      mobile_device_id: mobile_device_id
    };
    const result = await dbi.models.Chat.findAndCountAll({
      where: where,
      limit: per_page,
      offset: offset,
      order: order
    });
    res.json({
      chats: result.rows,
      count: result.rows.length,
      total_count: result.count
    })
  } catch (e) {
    next(e)
  }
};
exports.sendToClient = async(req, res, next) => {
  try {
  	const dbi = await db.getInstance();
    const machine_id = await machine.getId()
    const {
      params,
      body,
      query
    } = req;
    Object.assign(params, body, query);
    const {
      mobile_device_id
    } = params;
    const device_db_instance = await dbi.models.MobileDevice.findByPk(mobile_device_id) || {};
    const admin = req.account;
    console.log(req.account)
    const chat = await dbi.models.Chat.create({
      machine_id,
      mobile_device_id,
      admin_username: admin.username,
      message: params.message,
      sender_id: mobile_device_id,
      is_read_by_admin: true,
      is_read_by_user: false
    });
    const device = await devices_manager.findByMAC(device_db_instance.mac_address);
    if (device) {
      device.emit("chat", chat);
      notification.add(device_db_instance.id, {
        title: "Message from Admin:",
        content: `${chat.message}`
      })
    }
    socket_factory.emitAdmin("chat", chat);
    res.json(chat)
  } catch (e) {
    next(e)
  }
};
exports.bulkSendToClients = async(req, res, next) => {
  try {
    const dbi = await db.getInstance()
    const {
      params,
      body,
      query
    } = req;
    Object.assign(params, body, query);
    const admin = req.account;
    const clients = devices_manager.list;
    if (!clients || clients.length <= 0) {
      return next("Sending aborted, you have no online customers as of the moment.")
    }
    for (var i = 0; i < clients.length; i++) {
      const device = clients[i];
      const mobile_device_id = device.db_instance.id;
      const chat = await dbi.models.Chat.create({
        mobile_device_id: mobile_device_id,
        admin_username: admin.username,
        message: params.message,
        sender_id: mobile_device_id,
        is_read_by_admin: true,
        is_read_by_user: false
      });
      device.emit("chat", chat);
      socket_factory.emitAdmin("chat", chat);
      notification.add(mobile_device_id, {
        title: "Message from Admin",
        content: `${chat.message}`
      })
    }
    res.json({
      success: true
    })
  } catch (e) {
    next(e)
  }
};
exports.getMessages = async(req, res, next) => {
  const {
    device
  } = req;
  const dbi = await db.getInstance()
  try {
    const os = (req.headers["user-agent"] + "").toLowerCase().includes("android") ? "android" : "";
    const mobile_device_id = device.db_instance.id;
    var {
      page,
      per_page
    } = req.query;
    per_page = !isNaN(per_page) ? parseInt(per_page) : default_per_page;
    page = !isNaN(page) ? parseInt(page) : 1;
    const offset = (page - 1) * per_page;
    const order = [
      ["created_at", "DESC"]
    ];
    const where = {
      mobile_device_id: mobile_device_id
    };
    const result = await dbi.models.Chat.findAndCountAll({
      where: where,
      limit: per_page,
      offset: offset,
      order: order
    });
    const is_muted = !!await dbi.models.MutedDevice.findOne({
      where: where
    });
    res.json({
      is_muted: is_muted,
      chats: result.rows,
      count: result.rows.length,
      total_count: result.count,
      os: os
    })
  } catch (e) {
    next(e)
  }
};
exports.sendMessage = async(req, res, next) => {
  try {
    const {
      params,
      body,
      query,
      device
    } = req;
    const dbi = await db.getInstance()
    const machine_id = await machine.getId()

    Object.assign(params, body, query);
    const mobile_device_id = device.db_instance.id;
    const is_muted = !!await dbi.models.MutedDevice.findOne({
      where: {
        mobile_device_id: mobile_device_id
      }
    });
    if (is_muted) return next("You don't have permission to send message.");
    var {
      admin_username,
      message
    } = params;
    if (!admin_username) {
      const admins = await accounts.getAll();
      admin_username = admins[0].username
    }
    const chat = await dbi.models.Chat.create({
      machine_id: machine_id,
      mobile_device_id: mobile_device_id,
      admin_username: admin_username,
      message: message,
      sender_id: mobile_device_id,
      is_read_by_admin: false,
      is_read_by_user: true
    });
    device.emit("chat", chat);
    socket_factory.emitAdmin("chat", chat);
    res.json({
      success: true
    })
  } catch (e) {
    next(e)
  }
};
exports.readClientMessages = async(req, res, next) => {
  const {
    mobile_device_id
  } = req.params;
  const dbi = await db.getInstance()
  try {
    const where = {
      mobile_device_id: mobile_device_id
    };
    await dbi.models.Chat.update({
      is_read_by_admin: true
    }, {
      where: where
    });
    res.json({})
  } catch (e) {
    next(e)
  }
};
exports.readAdminMessages = async(req, res, next) => {
  const {
    device
  } = req;
  const dbi = await db.getInstance()

  try {
    await dbi.models.Chat.update({
      is_read_by_user: true
    }, {
      where: {
        mobile_device_id: device.db_instance.id
      }
    });
    res.json({})
  } catch (e) {
    next(e)
  }
};
exports.deleteConversation = async(req, res, next) => {
  try {
    const {
      params,
      body,
      query
    } = req;
    const dbi = await db.getInstance()

    Object.assign(params, body, query);
    var {
      mobile_device_id
    } = params;

    await dbi.models.Chat.destroy({
      where: {mobile_device_id}
    });
    res.json({
      success: true
    })
  } catch (e) {
    next(e)
  }
};