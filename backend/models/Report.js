module.exports = (sequelize, DataTypes) => {
    const Report = sequelize.define('Report', {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        user_id: { 
            type: DataTypes.INTEGER, 
            allowNull: false 
        },
        device_name: { 
            type: DataTypes.STRING(100), 
            allowNull: false 
        },
        issue_description: { 
            type: DataTypes.TEXT, 
            allowNull: false 
        },
        status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Nowe' },
        is_paused: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        paused_at: { type: DataTypes.DATE, allowNull: true },
        pause_reason: { type: DataTypes.STRING(100), allowNull: true },
        pause_note: { type: DataTypes.TEXT, allowNull: true },
        created_at: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW 
        }
    }, {
        tableName: 'reports',
        timestamps: false
    });

    // Report.associate = (models) => {
    //     Report.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    // };

    return Report;
};