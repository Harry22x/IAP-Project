const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production' || 
    (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1'));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...(isProduction ? { ssl: { rejectUnauthorized: false } } : {})
});

module.exports = pool;
