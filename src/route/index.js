const router = require('express').Router()
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const scriptName = path.basename(__filename)
const routePath = './src/route'
const config = require('./../config')
const responseHelper = require('./../helper/response')

router.get('/', (req, res) => {
    res.send({
        app: config.app.name,
        description: config.app.desc
    })
})

fs.readdirSync(routePath).forEach((file) => {
    // not including this file
    if (file != scriptName) {
        // get only filename, cut the file format (.js)
        const name = file.split('.')[0]
        router.use(`/${name}`, require(`./${name}`))
    }
})

// for non-existing route
router.all('*', (req, res) => {
    responseHelper.sendNotFoundResource(res)
})

module.exports = router
