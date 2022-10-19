const router = require('express').Router()
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const scriptName = path.basename(__filename)
const routePath = './src/route'

router.get('/', (req, res) => {
    res.send({app: 'Express Api'})
})

fs.readdirSync(routePath).forEach((file) => {
    // not including this file
    if (file != scriptName) {
        // get only filename, cut the file format (.js)
        const name = file.split('.')[0]
        router.use(`/${name}`, require(`./${name}`))
    }
})

router.all('*', (req, res) => {
    res.send({app: 'Not Found'})
})

module.exports = router
