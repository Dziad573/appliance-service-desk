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
        item_id: { type: DataTypes.INTEGER, allowNull: true },
        custom_device: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        device_name: { 
            type: DataTypes.STRING(100), 
            allowNull: false 
        },
        customer_name: { type: DataTypes.STRING(150), allowNull: true },
        customer_email: { type: DataTypes.STRING(254), allowNull: true },
        customer_phone: { type: DataTypes.STRING(40), allowNull: true },
        customer_country: { type: DataTypes.STRING(100), allowNull: true },
        customer_language: { type: DataTypes.STRING(50), allowNull: true },
        serial_number: { type: DataTypes.STRING(100), allowNull: true },
        serial_number_unavailable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        manufacturer: { type: DataTypes.STRING(100), allowNull: true },
        product_model: { type: DataTypes.STRING(150), allowNull: true },
        purchase_date: { type: DataTypes.DATEONLY, allowNull: true },
        complaint_type: { type: DataTypes.STRING(50), allowNull: true },
        issue_description: { 
            type: DataTypes.TEXT, 
            allowNull: false 
        },
        diagnosis_description: { type: DataTypes.TEXT, allowNull: true },
        repair_result: { type: DataTypes.TEXT, allowNull: true },
        repair_code: { type: DataTypes.STRING(20), allowNull: true },
        status: { 
            type: DataTypes.STRING(50), 
            allowNull: false, 
            defaultValue: 'Nowe' 
        },
        is_paused: { 
            type: DataTypes.BOOLEAN, 
            allowNull: false, 
            defaultValue: 0
        },
        paused_at: { 
            type: DataTypes.DATE, 
            allowNull: true 
        },
        pause_reason: { 
            type: DataTypes.STRING(100), 
            allowNull: true 
        },
        pause_note: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },
        created_at: { 
            type: DataTypes.DATE, 
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'reports',
        timestamps: false
    });

    return Report;
};