module.exports = (sequelize, DataTypes) => sequelize.define('Item', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  brand_id: { type: DataTypes.INTEGER, allowNull: false },
  item_type: { type: DataTypes.STRING(30), allowNull: false },
  item_name: { type: DataTypes.STRING(150), allowNull: false },
  model_number: { type: DataTypes.STRING(100), allowNull: true },
  part_number: { type: DataTypes.STRING(100), allowNull: true },
  purchase_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  sale_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  description: { type: DataTypes.STRING(500), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: 'items', timestamps: false });
