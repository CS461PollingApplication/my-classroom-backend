require('dotenv').config({ override: false})
const db = require('../app/models')

module.exports = () => {
   return db.sequelize.sync()
    .then(() => {
        return //can seed the database here
    })
}

module.exports.db = db