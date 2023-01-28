'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE Sections ADD UNIQUE KEY `Section_uniqueness`(`courseId`, `number`);'
    )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE Sections ADD UNIQUE KEY `Sections_courseId_foreign_idx`(`courseId`);'
    )
    await queryInterface.sequelize.query(
      'ALTER TABLE Sections DROP INDEX `Section_uniqueness`;'
    )
  }
};
