const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('expense_management', 'root', 'jepkorir18#', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306
});

sequelize.sync({ force: false }) // Set `force: true` to drop and recreate tables on every restart
    .then(() => {
        console.log('Database synchronized');
        process.exit(0); // Exit the process after synchronization
    })
    .catch(error => {
        console.error('Unable to sync the database:', error);
        process.exit(1); // Exit with an error code if synchronization fails
    });
