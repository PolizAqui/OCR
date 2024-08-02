const { PG_USER, PG_NAME, PG_PASS, PG_HOST } = require('../global/_var.js')

module.exports = {
    host: PG_HOST,
    user: PG_USER,
    database: PG_NAME,
    password: PG_PASS,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
}