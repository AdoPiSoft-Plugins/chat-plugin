'use strict'
var { sessions_manager } = require("../../core")

exports.data = {}
exports.get = (device_id)=>{
  if(!exports.data[device_id]) return
  return exports.data[device_id].splice(0, 1)
}

exports.add = (device_id, notif)=>{
  exports.data[device_id] = exports.data[device_id] || []
  exports.data[device_id].push(notif)
}

exports.subscribed_devices = []
exports.subscribe = async(device)=>{
  var device_id = device.db_instance.id
  if(exports.subscribed_devices.includes(device_id)) return
  var session = await sessions_manager.hasRunningSession(device)
  if(!session) return
  exports.subscribed_devices.push(device_id)
  var notified;
  var interval = setInterval(()=>{
    var {
      type,
      data_mb,
      data_consumption_mb,
      running_time_seconds,
      remaining_time_seconds
    } = session.db_instance

    var megabytes = (type == 'data' || type == 'time_or_data')
      ? data_mb - data_consumption_mb
      : data_consumption_mb

    var seconds = type == 'subscription'
      ? running_time_seconds
      : remaining_time_seconds
    var warn = ['time_or_data', 'data'].includes(type) && (megabytes <= 20 && megabytes >= 10 || megabytes <= 5)
    warn = warn || (['subscription', 'time', 'time_or_data'].includes(type) && (seconds <= 300 && seconds >= 290 || seconds <= 60) )

    if(warn){
      if (!notified){
        exports.add(device_id, {
          title: "LOW CREDITS",
          content: "You are running out of credits. Insert coin now to avoid interruption"
        })
        notified = true
      }
    }else{
      notified = false
    }
  }, 1000)
  var disconnected = ()=>{
    clearInterval(interval)
    exports.subscribed_devices = exports.subscribed_devices.filter(i=> i != device_id )
  }
  session.on("stop", disconnected)
  session.on("pause", disconnected)
}
