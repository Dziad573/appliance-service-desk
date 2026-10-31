const Sequelize = require('sequelize');
const sequelize = require('../config/sequelize');

const User = require('./User')(sequelize, Sequelize);
const Report = require('./Report')(sequelize, Sequelize);

User.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'user_id', as: 'user' });


module.exports = {
    sequelize,
    User,
    Report
};