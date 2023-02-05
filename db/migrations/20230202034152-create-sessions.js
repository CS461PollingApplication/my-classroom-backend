'use strict';
const moment = require('moment');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
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
        type: Sequelize.DATE(6),
        defaultValue: moment().add(4, 'H').utc().format("YYYY-MM-DD HH:mm:ss"),
        allowNull: false
    }
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.dropTable('Session');
  }
};
