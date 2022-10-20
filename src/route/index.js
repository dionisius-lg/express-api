const router = require('express').Router()
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const scriptName = path.basename(__filename)
const config = require('./../config')
const authMiddleware = require('./../middleware/auth')
const responseHelper = require('./../helper/response')
const routePath = './src/route'
const refreshTokenPath = '/token/refresh'
const publicPath = ['/token']

const matchInArray = (string, expressions) => {
    const len = expressions.length

    for (let i=0; i<len; i++) {
        if (string.match(expressions[i])) {
            return true
        }
    }

    return false
}

const checkPath = () => {
    return function(req, res, next) {
        const { path } = req
        const insideRegex = matchInArray(path, publicPath)

        if (_.indexOf(publicPath, path) >= 0 && insideRegex) {
            return next()
        }

        if (path === refreshTokenPath) {
            return authMiddleware.authenticateJWTRefresh(req, res, next)
        }

        return authMiddleware.authenticateJWT(req, res, next)
    }
}

router.get('/', (req, res) => {
    res.send({
        app: config.app.name,
        description: config.app.desc
    })
})

// enable auth middleware except for some routes
router.use(checkPath())

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
