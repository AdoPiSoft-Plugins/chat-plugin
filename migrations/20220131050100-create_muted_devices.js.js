'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('muted_devices', {
      id: {
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        unique: true
      },
      machine_id: {
        type: Sequelize.STRING
      },
      mobile_device_id: {
        type: Sequelize.UUID
      },
      muted_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },

  async down (queryInterface, Sequelize) {
   return queryInterface.dropTable('muted_devices');
  }
};
