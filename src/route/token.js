const router = require('express').Router()
const bcrypt = require('bcrypt')
const _ = require('lodash')
const responseHelper = require('./../helper/response')
const validationMiddleware = require('./../middleware/validation')
const authController = require('./../controller/auth')
const usersController = require('./../controller/users')
const authSchema = require('./../schema/auth')
const usersSchema = require('./../schema/users')

router.post('/', validationMiddleware(authSchema.token, 'body'), async (req, res) => {
    const { body, socket, headers } = req
    const { username, password } = body

    const user = await usersController.getDetail({
        username: username,
        is_active: 1
    })

    if (user.data === false) {
        return responseHelper.sendNotFoundData(res)
    }

    if (!bcrypt.compareSync(password, user.data.password)) {
        return responseHelper.sendUnauthorized(res)
    }

    const data = {
        id: user.data.id || 0,
        ip_address: socket.remoteAddress,
        user_agent: headers['user-agent']
    }

    const createToken = await authController.createToken(data)

    if (createToken.data === false) {
        responseHelper.sendInternalServerError(res)
    }

    return responseHelper.sendSuccessData(res, createToken)
})

router.post('/refresh', validationMiddleware(authSchema.refresh_token, 'body'), async (req, res) => {
    const { body, socket, headers, decoded } = req

    const checkToken = await authController.checkToken({
        token: body.token
    })

    if (checkToken.data === false) {
        return responseHelper.sendUnauthorized(res)
    }

    if (decoded.id != checkToken.data.user_id || decoded.ip_address != socket.remoteAddress || decoded.user_agent != headers['user-agent']) {
        return responseHelper.sendUnauthorized(res)
    }

    const user = await usersController.getDetail({
        id: decoded.id,
        is_active: 1
    })

    if (user.data === false) {
        return responseHelper.sendNotFoundData(res)
    }

    const data = {
        id: user.data.id || 0,
        ip_address: socket.remoteAddress,
        user_agent: headers['user-agent']
    }

    const createToken = await authController.createToken(data)

    return responseHelper.sendSuccessData(res, createToken)
})

module.exports = router
