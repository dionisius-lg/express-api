const express = require('express')
const app = express()
const cors = require('cors') 
const config = require('./src/config')
const router = require('./src/route')
const logger = require('./src/helper/logger')

// parsing application/x-www-form-urlencoded
app.use(express.json({limit: '25mb'}))
app.use(express.urlencoded({limit: '25mb', extended: true }))

// setup the logger
logger.setRequest(app)

// setup cors
app.use(cors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204 // some legacy browsers (IE11, various SmartTVs) choke on 204
}))

// define all router
app.use(router)

app.disable('x-powered-by')

app.listen(config.app.port, (err) => {
    if (err) {
        console.error(`server error`)
    } else {
        console.log(`App is up and running for ${config.app.env} environment | PORT: ${config.app.port}`)
    }
})
