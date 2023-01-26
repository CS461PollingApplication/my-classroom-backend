'use strict' 

const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
    const Session = sequelize.define('Session', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        //foriegn key for user, uncomment 
        //user_id: {
        //    type: DataTypes.INTEGER,
        //    allowNull: false,
        //    references: {
        //        model: User,
        //        key: 'id'
        //    },
        //},
        expires: {
            type: DataTypes.DATE(6),
            defaultValue: moment().add(4, 'hours').utc().format("YYYY-MM-DD HH:mm:ss"),
            allowNull: false
        }
    })

    //Sends true if the current session is expired, false if not
    Session.protoype.checkIfExpired = function (expires){
        return moment().utc().format("YYYY-MM-DD HH:mm:ss").IsAfter(expires);
    }

    return Session;
}

