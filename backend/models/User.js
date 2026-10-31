module.exports = (sequelize, DataTypes) => {
    return sequelize.define('User', {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        login: { 
            type: DataTypes.STRING(50), 
            unique: true, 
            allowNull: false 
        },
        password: { 
            type: DataTypes.STRING(255), 
            allowNull: false 
        },
        role: { 
            type: DataTypes.STRING(50), 
            allowNull: false 
        }
    }, {
        tableName: 'users',
        timestamps: false
    });
};