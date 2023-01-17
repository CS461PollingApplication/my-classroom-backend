'use script'

const { DataTypes } = require("sequelize")

module.exports = (sequelize, Database) => {
    const Section = sequelize.define('Section', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        number: {
            type: DataTypes.INTEGER,
            allowNull: false,            
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: [/*'courseId'*/, 'number']
            }
        ]
    })

    return Course
}