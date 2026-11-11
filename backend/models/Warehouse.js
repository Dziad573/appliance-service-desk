module.exports = (sequelize, DataTypes) => sequelize.define('Warehouse', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  warehouse_name: { type: DataTypes.STRING(120), allowNull: false },
  warehouse_type: { type: DataTypes.STRING(20), allowNull: false },
  department: { type: DataTypes.STRING(120), allowNull: true }
}, { tableName: 'warehouses', timestamps: false });
