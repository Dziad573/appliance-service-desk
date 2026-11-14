module.exports = (sequelize, DataTypes) => sequelize.define('StockDocumentItem', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  document_id: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  serial_number: { type: DataTypes.STRING(100), allowNull: true },
  report_part_id: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'stock_document_items', timestamps: false });
