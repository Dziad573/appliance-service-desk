const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Lightweight .env loader (keeps the project free from an additional config dependency).
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const separator = line.indexOf('=');
        if (separator < 1) continue;
        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
        if (process.env[key] === undefined) process.env[key] = value;
    }
}

const dialect = (process.env.DB_DIALECT || 'sqlite').toLowerCase();

let sequelize;
if (dialect === 'sqlite') {
    const storage = path.resolve(process.env.SQLITE_STORAGE || path.join(__dirname, '..', 'data', 'development.sqlite'));
    fs.mkdirSync(path.dirname(storage), { recursive: true });
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage,
        logging: false
    });
    console.log(`[DB] Local SQLite: ${storage}`);
} else if (dialect === 'mssql') {
    const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) throw new Error(`Missing MSSQL environment variables: ${missing.join(', ')}`);

    sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 1433),
        dialect: 'mssql',
        logging: false,
        dialectOptions: {
            options: {
                encrypt: process.env.DB_ENCRYPT !== 'false',
                trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
            }
        }
    });
    console.log('[DB] Azure SQL / Microsoft SQL Server selected');
} else {
    throw new Error(`Unsupported DB_DIALECT: ${dialect}. Use sqlite or mssql.`);
}

module.exports = sequelize;
