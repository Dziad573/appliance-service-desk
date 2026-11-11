const Sequelize = require('sequelize');
const sequelize = require('../config/sequelize');

const User = require('./User')(sequelize, Sequelize);
const Report = require('./Report')(sequelize, Sequelize);
const Comment = require('./Comment')(sequelize, Sequelize);
const ReportStatusHistory = require('./ReportStatusHistory')(sequelize, Sequelize);
const Brand = require('./Brand')(sequelize, Sequelize);
const Item = require('./Item')(sequelize, Sequelize);
const Warehouse = require('./Warehouse')(sequelize, Sequelize);
const Resource = require('./Resource')(sequelize, Sequelize);

User.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Brand.hasMany(Item, { foreignKey: 'brand_id', as: 'items' });
Item.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });
Item.hasMany(Resource, { foreignKey: 'item_id', as: 'resources' });
Resource.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
Warehouse.hasMany(Resource, { foreignKey: 'warehouse_id', as: 'resources' });
Resource.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
Item.hasMany(Report, { foreignKey: 'item_id', as: 'reports' });
Report.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

// Komentarze należą do reklamacji i użytkownika, mogą też odpowiadać na inny komentarz.
Report.hasMany(Comment, { foreignKey: 'report_id', as: 'comments' });
Comment.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });
User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
Comment.belongsTo(Comment, { foreignKey: 'parent_comment_id', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parent_comment_id', as: 'replies' });

Report.hasMany(ReportStatusHistory, { foreignKey: 'report_id', as: 'statusHistory' });
ReportStatusHistory.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });
User.hasMany(ReportStatusHistory, { foreignKey: 'changed_by', as: 'statusChanges' });
ReportStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });

module.exports = {
    sequelize,
    User,
    Report,
    Comment,
    ReportStatusHistory, Brand, Item, Warehouse, Resource
};
