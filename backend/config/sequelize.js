const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('USWB', 'KrySma', '!@#TREGD12dsadFSWQE!@#WASD', {
    host: 'uswb-database-server.database.windows.net',
    dialect: 'mssql',
    logging: false,
    dialectOptions: {
        options: {
            encrypt: true,
            // trustServerCertificate: true // SSL
        }
    }
});

module.exports = sequelize;