'use strict'

var core = require('../core')
var { router } = core
var devices_ctrl = require('./controllers/devices_ctrl')
var chats_ctrl = require('./controllers/chats_ctrl')

router.get('/chat-plugin/devices', core.middlewares.auth, devices_ctrl.get)
router.get('/chat-plugin/device/:mobile_device_id', devices_ctrl.getDeviceData)
router.post('/chat-plugin/chats/:mobile_device_id/mute', core.middlewares.auth, devices_ctrl.muteDevice)
router.post('/chat-plugin/chats/:mobile_device_id/unmute', core.middlewares.auth, devices_ctrl.unmuteDevice)
router.get('/chat-plugin/chats/:mobile_device_id', core.middlewares.auth, chats_ctrl.getClientMessages)
router.post('/chat-plugin/chats/bulk-send', core.middlewares.auth, chats_ctrl.bulkSendToClients)
router.post('/chat-plugin/chats/:mobile_device_id', core.middlewares.auth, chats_ctrl.sendToClient)
router.post('/chat-plugin/chats/:mobile_device_id/mark-read', core.middlewares.auth, chats_ctrl.readClientMessages)
router.delete('/chat-plugin/chats/:mobile_device_id', core.middlewares.auth, chats_ctrl.deleteConversation)

router.get('/chat-plugin/portal/chats', chats_ctrl.getMessages)
router.post('/chat-plugin/portal/chat', chats_ctrl.sendMessage)
router.get('/chat-plugin/portal/mark-read', chats_ctrl.readAdminMessages)

module.exports = router
