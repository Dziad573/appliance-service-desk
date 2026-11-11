module.exports = (sequelize, DataTypes) => sequelize.define('Resource', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
}, { tableName: 'resources', timestamps: false, indexes: [{ unique: true, fields: ['item_id', 'warehouse_id'] }] });
