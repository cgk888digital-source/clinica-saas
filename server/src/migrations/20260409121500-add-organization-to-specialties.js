'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists to prevent errors
    const tableInfo = await queryInterface.describeTable('Specialties');
    if (!tableInfo.organizationId) {
      await queryInterface.addColumn('Specialties', 'organizationId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Specialties', 'organizationId');
  }
};
