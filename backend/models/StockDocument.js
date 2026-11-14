module.exports = (sequelize, DataTypes) => sequelize.define('StockDocument', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  direction: { type: DataTypes.STRING(10), allowNull: false },
  warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
  reference_report_id: { type: DataTypes.INTEGER, allowNull: true },
  source_type: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'manual' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'stock_documents', timestamps: false });
