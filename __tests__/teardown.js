require('dotenv').config({ override: false})
const db = require('../app/models')

module.exports = async function () {
    await db.sequelize.close()
    process.exit()
};