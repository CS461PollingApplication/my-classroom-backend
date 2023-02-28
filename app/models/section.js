'use strict'

const { generateOTP } = require("../../lib/auth")

module.exports = (sequelize, DataTypes) => {
    const Section = sequelize.define('Section', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        courseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Courses',
                key: 'id'
            },
            validate: {
                notNull: {
                    msg: "A section must belong to a course"
                }
            }
        },
        number: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        joinCode: {
            type: DataTypes.STRING,
            unique: true,
            validate: {
                isAlphanumeric: true,
                notEmpty: {
                    msg: "Section join code cannot be empty"
                },
                unique: {
                    msg: "Section join code cannot be the same as another section's join code"
                },
                len: {
                    args: [6, 6],
                    msg: 'Section join code must be 6 characters'
                }
            }
        },
    },
    {
        indexes: [
            {
                unique: true,
                fields: ['courseId', 'number'],
                name: 'custom_unique_section_constraint'
            }
        ],
        timestamps: true,
        hooks: {
            beforeCreate: async (section) => {
                section.joinCode = generateOTP(6)
            }
        }
    })

    Section.associate = (models) => {
        Section.hasMany(models.Enrollment)
    }

    return Section
}