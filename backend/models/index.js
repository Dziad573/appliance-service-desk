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
const ReportPart = require('./ReportPart')(sequelize, Sequelize);
const ReportPricingPart = require('./ReportPricingPart')(sequelize, Sequelize);
const StockDocument = require('./StockDocument')(sequelize, Sequelize);
const StockDocumentItem = require('./StockDocumentItem')(sequelize, Sequelize);

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
Report.hasMany(ReportPart, { foreignKey: 'report_id', as: 'parts' });
Report.hasMany(ReportPricingPart, { foreignKey: 'report_id', as: 'pricingParts' });
ReportPricingPart.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });
ReportPart.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });
Item.hasMany(ReportPart, { foreignKey: 'item_id', as: 'reportParts' });
ReportPart.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
Warehouse.hasMany(ReportPart, { foreignKey: 'warehouse_id', as: 'reportParts' });
Warehouse.hasMany(StockDocument, { foreignKey: 'warehouse_id', as: 'stockDocuments' });
StockDocument.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
Report.hasMany(StockDocument, { foreignKey: 'reference_report_id', as: 'stockDocuments' });
StockDocument.belongsTo(Report, { foreignKey: 'reference_report_id', as: 'report' });
User.hasMany(StockDocument, { foreignKey: 'created_by', as: 'stockDocuments' });
StockDocument.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
StockDocument.hasMany(StockDocumentItem, { foreignKey: 'document_id', as: 'items', onDelete: 'CASCADE' });
StockDocumentItem.belongsTo(StockDocument, { foreignKey: 'document_id', as: 'document' });
Item.hasMany(StockDocumentItem, { foreignKey: 'item_id', as: 'stockDocumentItems' });
StockDocumentItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
ReportPart.hasMany(StockDocumentItem, { foreignKey: 'report_part_id', as: 'stockDocumentItems' });
StockDocumentItem.belongsTo(ReportPart, { foreignKey: 'report_part_id', as: 'reportPart' });
ReportPart.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

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
    ReportStatusHistory, Brand, Item, Warehouse, Resource, ReportPart, ReportPricingPart, StockDocument, StockDocumentItem
};
