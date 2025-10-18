'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Extend User.role enum to include seller and reporter
    // Note: MySQL ENUM alteration requires full enum recreation
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user', 'seller', 'reporter'),
      allowNull: false,
      defaultValue: 'user'
    });

    // Create Reports table
    await queryInterface.createTable('Reports', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      title: { type: Sequelize.STRING, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('submitted', 'reviewed', 'rejected'), defaultValue: 'submitted' },
      billboardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Billboards', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addIndex('Reports', ['billboardId']);
    await queryInterface.addIndex('Reports', ['authorId']);
    await queryInterface.addIndex('Reports', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Reports');
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      allowNull: false,
      defaultValue: 'user'
    });
  }
};
