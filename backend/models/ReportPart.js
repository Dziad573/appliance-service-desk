module.exports = (sequelize, DataTypes) => sequelize.define('ReportPart', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  report_id: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  issue_type: { type: DataTypes.STRING(20), allowNull: false },
  issued_by: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'issued' },
  returned_at: { type: DataTypes.DATE, allowNull: true },
  returned_by: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'report_parts', timestamps: false });
