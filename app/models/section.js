'use strict'

const { DataTypes } = require("sequelize")

module.exports = (sequelize, Database) => {
    const Section = sequelize.define('Section', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        // UNCOMMENT: 
        // courseId: {
        //     type: DataTypes.INTEGER,
        //     references: {
        //         model: Course,
        //         key: 'id'
        //     }
        // },
        number: {
            type: DataTypes.INTEGER,
            allowNull: false,            
        }
    },
    {
        indexes: [
            {
                unique: true,
                fields: ['number']
            }
        ]
    },
    {
        timestamps: true
    }
    )

    // Course.hasMany(Section, {
    //     foreignKey: 'courseId'
    // });
    // Section.belongsTo(Course);

    return Section
}