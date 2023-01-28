'use strict'

module.exports = (sequelize, DataTypes) => {
    const Response = sequelize.define('Response', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        score: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "a response must have a score"
                },
                min: {
                    args: [0],
                    msg: "score cannot be less than 0"
                },
                max: {
                    args: [1],
                    msg: "score cannot be more than 1"
                }
            }
        },
        // the submission object is what was sent in the POST/PUT request body from the frontend. It should store the answers, for example
        submission: {
            type: DataTypes.JSON,
            defaultValue: {}
        }
    },
    {
        timestamps: true
    })

    return Response;
}