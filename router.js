var express = require('express')
var fileUpload = require('express-fileupload')
var devices_ctrl = require('./controllers/devices_ctrl.js')
var chats_ctrl = require('./controllers/chats_ctrl.js')
var core = require('@adopisoft/plugin-core')
var { middlewares } = core
var { cookie_parser, device_cookie, ipv4, user_agent, device_reg, auth } = middlewares
var router = express.Router()

var device_middlewares = [
  ipv4,
  user_agent,
  device_cookie.read,
  device_cookie.portalCookie,
  device_reg
]

router.use(cookie_parser)
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.get('/setting', chats_ctrl.getSettings)
router.post('/setting', auth, chats_ctrl.updateSettings)
router.post('/upload-apk', auth, fileUpload(), chats_ctrl.uploadApk)

router.get('/devices', auth, devices_ctrl.get)
router.get('/device/:mobile_device_id', ...device_middlewares, devices_ctrl.getDeviceData)
router.post('/chats/:mobile_device_id/mute', auth, devices_ctrl.muteDevice)

router.post('/chats/:mobile_device_id/unmute', auth, devices_ctrl.unmuteDevice)

router.get('/chats/:mobile_device_id', auth, chats_ctrl.getClientMessages)
router.post('/chats/bulk-send', auth, chats_ctrl.bulkSendToClients)

router.post('/chats/:mobile_device_id', auth, chats_ctrl.sendToClient)

router.post('/chats/:mobile_device_id/mark-read', auth, chats_ctrl.readClientMessages)

router.delete('/chats/:mobile_device_id', auth, chats_ctrl.deleteConversation)

router.get('/portal/chats', ...device_middlewares, chats_ctrl.getMessages)
router.post('/portal/chat', ...device_middlewares, chats_ctrl.sendMessage)

router.get('/portal/mark-read', ...device_middlewares, chats_ctrl.readAdminMessages)

router.get('/notifications', devices_ctrl.getNotifications)
router.get('/unread-device-ids', devices_ctrl.getUnreadDeviceIds)

module.exports = router
