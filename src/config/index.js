const dotenv = require('dotenv')

dotenv.config({ path: './.env' })

const config = {
    app : {
        env: process.env.APP_ENV || 'development',
        port: process.env.APP_PORT || 3000,
        name: 'Express API',
        desc: 'Provide service data for Desktop, Mobile, and Web App.',
    },
    db: {
        host: process.env.DB_HOST || '',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USERNAME || 'root',
        pass: process.env.DB_PASS || '',
        name: process.env.DB_NAME || '',
    },
    jwt: {
        key: process.env.JWT_KEY || 'the_key',
        keyRefresh: process.env.JWT_KEY_REFRESH || 'the_key',
        algorithm: process.env.JWT_ALGORITHM || 'HS256',
        live: process.env.JWT_LIVE || 0, // token will apply after this value (in seconds)
        expire: process.env.JWT_EXPIRE || '1h', // token will expire after this value (in seconds or a string describing a time span zeit/ms)
        expireRefresh: process.env.JWT_EXPIRE_REFRESH || '1h', // refresh token will expire after this value (in seconds or a string describing a time span zeit/ms)
    },
    timezone: 'Asia/Jakarta'
}

module.exports = config
