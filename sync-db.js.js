const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('expense_management', 'root', 'jepkorir18#', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306
});

sequelize.sync({ force: false }) 
    .then(() => {
        console.log('Database synchronized');
        process.exit(0); 
    })
    .catch(error => {
        console.error('Unable to sync the database:', error);
        process.exit(1); 
    });
