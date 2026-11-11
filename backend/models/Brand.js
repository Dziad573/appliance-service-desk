module.exports = (sequelize, DataTypes) => sequelize.define('Brand', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  brand_name: { type: DataTypes.STRING(100), allowNull: false, unique: true }
}, { tableName: 'brands', timestamps: false });
