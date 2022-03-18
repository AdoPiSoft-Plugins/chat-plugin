"use strict";
var notification = require("../store/notification");
const db = require('@adopisoft/core/models')
const {devices_manager,machine} = require('@adopisoft/exports')
var default_per_page = 20;

exports.get = async(req, res, next) => {
  try {
    var {
      page,
      q,
      per_page
    } = req.query;
    if (!per_page) per_page = default_per_page;
    if (!page) page = 1;
    var limit = parseInt(per_page);
    var offset = (page - 1) * limit;

    const dbi = await db.getInstance();

    const {
      Op
    } = dbi.Sequelize;
    const {Sequelize} = dbi

    var search_q = q;
    var where = {};
    if (search_q) {
      search_q = search_q.toLowerCase();
      where[Op.or] = [Sequelize.where(Sequelize.fn("lower", Sequelize.col("hostname")), {
        [Op.like]: `%${search_q}%`
      }), Sequelize.where(Sequelize.fn("lower", Sequelize.col("mac_address")), {
        [Op.like]: `%${search_q}%`
      }), Sequelize.where(Sequelize.fn("lower", Sequelize.col("ip_address")), {
        [Op.like]: `%${search_q}%`
      })];
      var statuses = ["connected", "disconnected"];
      if (statuses.includes(search_q)) {
        where[Op.or].push({
          status: {
            [Op.eq]: search_q
          }
        })
      }
    }
    var total_count = await dbi.models.MobileDevice.scope(["default_scope"]).count({
      where: where
    });
    var result = await dbi.models.MobileDevice.scope(["default_scope"]).findAll({
      distinct: true,
      where: where,
      limit: limit,
      offset: offset,
      include: [{
        model: dbi.models.Chat,
        order: [
          ["is_read_by_admin", "ASC"]
        ],
        limit: 1,
        required: false
      }],
      order: [
        ["active", "DESC"]
      ]
    });
    var devices = result.map(d => {
      d = d.toJSON();
      d.has_unread = d.Chats.filter(c => !c.is_read_by_admin).length > 0;
      return d
    }).sort(d => !d.has_unread);
    res.json({
      devices: devices,
      count: devices.length,
      total_count: total_count
    })
  } catch (e) {
    next(e)
  }
};
exports.getDeviceData = async(req, res, next) => {
  try {
    const dbi = await db.getInstance();

    var {
      mobile_device_id
    } = req.params;
    var is_muted = !!await dbi.models.MutedDevice.findOne({
      where: {mobile_device_id}
    });
    var device = await devices_manager.loadDevice(mobile_device_id);
    res.json(Object.assign(device.toJSON(), {
      is_muted: is_muted
    }))
  } catch (e) {
    next(e)
  }
};
exports.muteDevice = async(req, res, next) => {
  try {
    const dbi = await db.getInstance()
    const machine_id = await machine.getId()

    var {
      mobile_device_id
    } = req.params;
    var device = await devices_manager.loadDevice(mobile_device_id);
    await dbi.models.MutedDevice.create({
      machine_id: machine_id,
      mobile_device_id: mobile_device_id,
      muted_at: new Date
    });
    device.emit("chat:mute");
    res.json({})
  } catch (e) {
    next(e)
  }
};
exports.unmuteDevice = async(req, res, next) => {
  try {
    const dbi = await db.getInstance()
    var {
      mobile_device_id
    } = req.params;
    var device = await devices_manager.loadDevice(mobile_device_id);
    await dbi.models.MutedDevice.destroy({
      where: {
        mobile_device_id: mobile_device_id
      }
    });
    device.emit("chat:unmute");
    res.json({})
  } catch (e) {
    next(e)
  }
};
exports.getUnreadDeviceIds = async(req, res, next) => {
  try {
    const dbi = await db.getInstance();

    var result = await dbi.models.Chat.findAll({
      where: {
        is_read_by_admin: false
      },
      distinct: true,
      attributes: ["mobile_device_id"]
    });
    var mobile_device_ids = result.map(r => r.mobile_device_id);
    res.json(mobile_device_ids)
  } catch (e) {
    next(e)
  }
};
exports.getNotifications = async(req, res, next) => {
  try {
    var {
      device
    } = req;
    await notification.subscribe(device);
    var [notif] = notification.get(device.db_instance.id) || [];
    res.json(notif || {})
  } catch (e) {
    next(e)
  }
};
