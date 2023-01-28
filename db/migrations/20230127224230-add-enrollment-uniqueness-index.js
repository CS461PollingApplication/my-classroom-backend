'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.sequelize.query(
      'ALTER TABLE Enrollments ADD UNIQUE KEY `enrollment_uniqueness`(`userId`, `courseId`, `sectionId`);'
    )
    queryInterface.sequelize.query(
      'ALTER TABLE Enrollments DROP INDEX `Enrollments_userId_foreign_idx`;'
    )
  },

  async down (queryInterface, Sequelize) {
    queryInterface.sequelize.query(
      'ALTER TABLE Enrollments ADD UNIQUE KEY `Enrollments_userId_foreign_idx`(`userId`);'
    )
    queryInterface.sequelize.query(
      'ALTER TABLE Enrollments DROP INDEX `enrollment_uniqueness`;'
    )
  }
};
