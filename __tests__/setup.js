require('dotenv').config({ override: false})
const db = require('../app/models/index')

module.exports = async () => {
   await db.sequelize.sync()
}

module.exports.db = db