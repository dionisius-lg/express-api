const mysql = require('mysql');
const config = require('./index').db

const pool = mysql.createPool({
    connectionLimit: 10,
    host: config.host,
    user: config.user,
    password: config.pass,
    database: config.name,
    port: config.port,
    charset: 'UTF8MB4_GENERAL_CI',
    multipleStatements: true,
    dateStrings: true // Force date types (TIMESTAMP, DATETIME, DATE) to be returned as strings rather then inflated into JavaScript Date objects. (Default: false)
})

pool.getConnection((err) => {
    if (err) throw err
})

module.exports = pool
