'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE Enrollments ADD UNIQUE KEY `enrollment_uniqueness`(`userId`, `courseId`, `sectionId`);'
    )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE Enrollments ADD UNIQUE KEY `Enrollments_userId_foreign_idx`(`userId`);'
    )
    await queryInterface.sequelize.query(
      'ALTER TABLE Enrollments DROP INDEX `enrollment_uniqueness`;'
    )
  }
};
