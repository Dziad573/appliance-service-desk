module.exports = (sequelize, DataTypes) => sequelize.define('ReportPricingPart', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  report_id: { type: DataTypes.INTEGER, allowNull: false },
  item_id: { type: DataTypes.INTEGER, allowNull: true },
  item_name: { type: DataTypes.STRING(200), allowNull: false },
  part_number: { type: DataTypes.STRING(100), allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  charge_customer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, { tableName: 'report_pricing_parts', timestamps: false });
