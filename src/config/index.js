const dotenv = require('dotenv')

dotenv.config({ path: './.env' })

const config = {
    app : {
        env: process.env.APP_ENV || 'development',
        port: process.env.APP_PORT || 3000,
    },
    db: {
        host: process.env.DB_HOST || '',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USERNAME || 'root',
        pass: process.env.DB_PASS || '',
        name: process.env.DB_NAME || '',
    },
    timezone: 'Asia/Jakarta',
}

module.exports = config
