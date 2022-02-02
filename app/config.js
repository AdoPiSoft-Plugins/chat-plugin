const path = require('path')
const randomstring = require('randomstring')

const ini_file = 'chat.ini'
const fs = require('fs-extra')
const ini_parser = require('@adopisoft/core/utils/ini-parser.js')
const ini = require('ini')

const icon_dir = '/assets/images/icon'
const icon_dir_path = path.join(__dirname, '/../', icon_dir)
exports.DEFAULT_ICON = 'chat.png'

exports.read = async () => {
  const cfg = await ini_parser(ini_file)
  return cfg
}
exports.save = async (cfg) => {
	if(!cfg) return
  const ini_file_path = path.join(process.env.APPDIR, 'config',ini_file)
  await fs.promises.writeFile(ini_file_path, ini.stringify(cfg))
}

exports.filename = async () => {
  const files = await fs.readdir(icon_dir_path)
  if(files.length > 1){
    return files.filter(f => f !== exports.DEFAULT_ICON)[0]
  }else {
    return exports.DEFAULT_ICON
  }
}
exports.getIcon = async () => {
  const f = await exports.filename()
  return f
}

exports.saveIcon = async(file) => {
  const curr_icon = await exports.filename()

  if(file.name === exports.DEFAULT_ICON){
    var ext = path.extname(file.name)
    var rand_str = randomstring.generate({length: 8})
    file.name = `${path.basename(file.name).replace(ext, '')}-${rand_str}${ext}`
  }

  if(curr_icon !== exports.DEFAULT_ICON){
    await fs.remove(path.join(icon_dir_path, curr_icon))
  }

  await file.mv(path.join(icon_dir_path, file.name))
  return file.name
}

exports.restoreIcon = async () => {
  const files = await fs.readdir(icon_dir_path)
  const fn = files.filter(f => f !== exports.DEFAULT_ICON)[0]
  if(fn) await fs.remove(path.join(icon_dir_path, fn))

  return exports.DEFAULT_ICON
}