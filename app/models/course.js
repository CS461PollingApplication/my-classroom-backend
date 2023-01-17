'use script'

const { DataTypes } = require("sequelize")

module.exports = (sequelize, Database) => {
    const Course = sequelize.define('Course', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Course name required"
                },
                notEmpty: {
                    msg: "Course name cannot be empty"
                }
            },
            max: {
                args: [50],
                msg: "Course name must be less than 50 characters"
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            max: {
                args: [500],
                msg: "Course description must be less than 500 characters"
            }
        },
        published: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    })

    return Course
}