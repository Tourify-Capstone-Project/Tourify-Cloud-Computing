// Require mysql
const mysql = require('mysql');
const util = require('util');
require('dotenv').config();

//========================================================================================================

// Create a connection to database MySQL
const dbConfig = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
    connectionTimeout: 10000,
});

// Promisify the query method
dbConfig.query = util.promisify(dbConfig.query);

// Export the connection
module.exports = dbConfig;