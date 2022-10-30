const router = require('express').Router()
const moment = require('moment-timezone')
const bcrypt = require('bcrypt')
const config = require('./../config')
const validationMiddleware = require('./../middleware/validation')
const responseHelper = require('./../helper/response')
const usersController = require('./../controller/users')
const usersSchema = require('./../schema/users')

moment.tz.setDefault(config.timezone)

router.get('/', async (req, res, next) => {
    const { query } = req
    const result = await usersController.getAll(query)

    return responseHelper.sendSuccessData(res, result)
})

router.get('/:id', validationMiddleware(usersSchema.detail, 'params'), async (req, res, next) => {
    const { params } = req
    const conditions = { id: params.id }
    const result = await usersController.getDetail(conditions)

    if (result.data === false) {
        return responseHelper.sendNotFoundData(res, result)
    }

    if (result.data.hasOwnProperty('password')) {
        delete result.data.password
    }

    return responseHelper.sendSuccessData(res, result)
})

router.post('/', validationMiddleware(usersSchema.create, 'body'), async (req, res, next) => {
    const { body, decoded } = req

    if (typeof body.created_date === 'undefined') {
        body.created_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }

    if (typeof body.created_user_id === 'undefined') {
        body.created_user_id = decoded.id
    }

    if (typeof body.password !== 'undefined') {
        body.password = bcrypt.hashSync(body.password, 10)
    } else {
        body.password = bcrypt.hashSync(body.username, 10)
    }

    const result = await usersController.insertData(body)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }

    return responseHelper.sendSuccessData(res, result, 201)
})

router.put('/:id', validationMiddleware(usersSchema.update, 'body'), async (req, res, next) => {
    const { params, body, decoded } = req

    if (typeof body.updated_date === 'undefined') {
        body.updated_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }

    if (typeof body.updated_user_id === 'undefined') {
        body.updated_user_id = decoded.id
    }

    if (typeof body.password !== 'undefined') {
        body.password = bcrypt.hashSync(body.password, 10)
    }

    const conditions = { id: params.id }
    const result = await usersController.updateData(body, conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

router.delete('/:id', validationMiddleware(usersSchema.detail, 'params'), async (req, res, next) => {
    const { params } = req
    const conditions = { id: params.id }
    const result = await usersController.deleteData(conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

module.exports = router
