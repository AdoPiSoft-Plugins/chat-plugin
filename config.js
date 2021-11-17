const fs = require('fs-extra')
const ini = require('ini')
const path = require('path')
const default_ini_path = path.join(__dirname, 'config/default.ini')
const user_ini_path = path.join(__dirname, 'config/custom.ini')

module.exports = {
  async read () {
    const ini_str = await fs.readFile(user_ini_path, 'utf8').catch(e => {
      return fs.readFile(default_ini_path, 'utf8')
    })
    return ini.decode(ini_str)
  },
  async save (cfg) {
    await fs.outputFile(user_ini_path, ini.encode(cfg))
  }
}
