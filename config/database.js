const Sequelize = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT, // Vital for Aiven (it's not usually 3306)
        dialect: 'mysql',
        logging: false, // Set to console.log to see raw SQL queries
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Allows self-signed certs
            }
        }
    }
);

module.exports = sequelize;