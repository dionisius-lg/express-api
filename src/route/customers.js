const router = require('express').Router()
const moment = require('moment-timezone')
const config = require('./../config')
const validationMiddleware = require('./../middleware/validation')
const responseHelper = require('./../helper/response')
const customersController = require('./../controller/customers')
const customersSchema = require('./../schema/customers')

moment.tz.setDefault(config.timezone)

router.get('/', async (req, res, next) => {
    const { query } = req
    const result = await customersController.getAll(query)

    return responseHelper.sendSuccessData(res, result)
})

router.get('/:id', validationMiddleware(customersSchema.detail, 'params'), async (req, res, next) => {
    const { params } = req
    const conditions = { id: params.id }
    const result = await customersController.getDetail(conditions)

    if (result.data === false) {
        return responseHelper.sendNotFoundData(res, result)
    }

    return responseHelper.sendSuccessData(res, result)
})

router.post('/', validationMiddleware(customersSchema.create, 'body'), async (req, res, next) => {
    const { body, decoded } = req

    if (typeof body.created_date === 'undefined') {
        body.created_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }

    if (typeof body.created_user_id === 'undefined') {
        body.created_user_id = decoded.id
    }

    const result = await customersController.insertData(body)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }

    return responseHelper.sendSuccessData(res, result, 201)
})

router.put('/:id', validationMiddleware(customersSchema.update, 'body'), async (req, res, next) => {
    const { params, body, decoded } = req

    if (typeof body.updated_date === 'undefined') {
        body.updated_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }

    if (typeof body.updated_user_id === 'undefined') {
        body.updated_user_id = decoded.id
    }

    const conditions = { id: params.id }
    const result = await customersController.updateData(body, conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

router.delete('/:id', validationMiddleware(customersSchema.detail, 'params'), async (req, res, next) => {
    const { params } = req
    const conditions = { id: params.id }
    const result = await customersController.deleteData(conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

module.exports = router
