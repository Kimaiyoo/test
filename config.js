const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('expense_management', 'root', 'jepkorir18#', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306
});

module.exports = sequelize;
