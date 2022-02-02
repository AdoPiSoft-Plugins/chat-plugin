"use strict";
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const device_reg = require('@adopisoft/core/middlewares/device.js')
const ipv4 = require('@adopisoft/core/middlewares/ipv4.js')
const devices_ctrl = require("./controllers/devices_ctrl");
const chats_ctrl = require("./controllers/chats_ctrl");
const auth = require('@adopisoft/core/middlewares/auth.js')
const cookie_parser = require('@adopisoft/core/middlewares/cookie_parser.js')
const device_cookie = require('@adopisoft/core/middlewares/device_cookie.js')

router.use(cookie_parser)
router.use(device_cookie.read)
router.use(device_cookie.portalCookie)

router.get("/chat-plugin/setting", chats_ctrl.getSettings);
router.post("/chat-plugin/setting",express.urlencoded({
  extended: true
}), bodyParser.json(), auth, chats_ctrl.updateSettings);
router.post("/chat-plugin/setting/icon", auth,fileUpload({
  limits: {fileSize: 5 * 1024 * 1024 * 1024},
  useTempFiles: true,
  tempFileDir: process.env.TMPDIR
}), chats_ctrl.uploadIcon);
router.post("/chat-plugin/setting/restore-icon", auth, chats_ctrl.restoreDefaultIcon)
router.get("/chat-plugin/devices", auth, devices_ctrl.get);
router.get("/chat-plugin/device/:mobile_device_id", devices_ctrl.getDeviceData);
router.post("/chat-plugin/chats/:mobile_device_id/mute",express.urlencoded({
  extended: true
}), bodyParser.json(), auth, devices_ctrl.muteDevice);
router.post("/chat-plugin/chats/:mobile_device_id/unmute",express.urlencoded({
  extended: true
}), bodyParser.json(), auth, devices_ctrl.unmuteDevice);
router.get("/chat-plugin/chats/:mobile_device_id", auth, chats_ctrl.getClientMessages);
router.post("/chat-plugin/chats/bulk-send",express.urlencoded({
  extended: true
}), bodyParser.json(), auth, chats_ctrl.bulkSendToClients);
router.post("/chat-plugin/chats/:mobile_device_id",express.urlencoded({
  extended: true
}), bodyParser.json(), auth, chats_ctrl.sendToClient);
router.post("/chat-plugin/chats/:mobile_device_id/mark-read",express.urlencoded({
  extended: true
}), bodyParser.json(), auth, chats_ctrl.readClientMessages);
router.delete("/chat-plugin/chats/:mobile_device_id", auth, chats_ctrl.deleteConversation);
router.get("/chat-plugin/portal/chats", ipv4, device_reg, chats_ctrl.getMessages);
router.post("/chat-plugin/portal/chat",express.urlencoded({
  extended: true
}), bodyParser.json(), ipv4, device_reg, chats_ctrl.sendMessage);
router.get("/chat-plugin/portal/mark-read", ipv4, device_reg, chats_ctrl.readAdminMessages);
router.get("/client/notifications", devices_ctrl.getNotifications);
router.get("/chat-plugin/unread-device-ids", devices_ctrl.getUnreadDeviceIds);

module.exports = router;