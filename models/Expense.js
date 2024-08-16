// models/expense.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config');
const User = require('./User');

class Expense extends Model {}

Expense.init({
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'Expense',
    tableName: 'Expenses'
});

// Define relationships
Expense.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Expense, { foreignKey: 'user_id' });

module.exports = Expense;
