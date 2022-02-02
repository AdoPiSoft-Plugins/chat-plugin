'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.createTable('chats',{
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
      sender_id: {
        type: Sequelize.STRING
      },
      mobile_device_id: {
        type: Sequelize.UUID
      },
      admin_username: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.TEXT
      },
      is_read_by_user: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_read_by_admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
   return queryInterface.dropTable('chats');
  }
};
