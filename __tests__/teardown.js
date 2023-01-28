require('dotenv').config({ override: false})
const db = require('../app/models/index')

module.exports = async () => {
    await db.sequelize.close()
    process.exit()
};