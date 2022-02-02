"use strict";
var model_name = "Chat";
var table_name = "chats";
var opts = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  underscored: true,
  timestamps: true,
  tableName: table_name
};

module.exports = (sequelize, Sequelize) => {
  var model = sequelize.define(model_name, {
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
      type: Sequelize.UUID
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
  }, opts);
  return model
};