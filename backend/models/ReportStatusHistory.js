module.exports = (sequelize, DataTypes) => sequelize.define('ReportStatusHistory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    report_id: { type: DataTypes.INTEGER, allowNull: false },
    old_status: { type: DataTypes.STRING(50), allowNull: true },
    new_status: { type: DataTypes.STRING(50), allowNull: false },
    action: { type: DataTypes.STRING(20), allowNull: false },
    reason: { type: DataTypes.STRING(100), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    changed_by: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'report_status_history', timestamps: false });
