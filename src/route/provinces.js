const router = require('express').Router()
const moment = require('moment-timezone')
const config = require('./../config')
const validationMiddleware = require('./../middleware/validation')
const responseHelper = require('./../helper/response')
const provincesController = require('./../controller/provinces')
const provincesSchema = require('./../schema/provinces')

moment.tz.setDefault(config.timezone)

router.get('/', async (req, res, next) => {
    const { query } = req
    const result = await provincesController.getAll(query)

    return responseHelper.sendSuccessData(res, result)
})

router.get('/:id', validationMiddleware(provincesSchema.detail, 'params'), async (req, res, next) => {
    const { params } = req
    const conditions = { id: params.id }
    const result = await provincesController.getDetail(conditions)

    if (result.data === false) {
        return responseHelper.sendNotFoundData(res, result)
    }

    return responseHelper.sendSuccessData(res, result)
})

router.post('/', validationMiddleware(provincesSchema.create, 'body'), async (req, res, next) => {
    const { body } = req
    const result = await provincesController.insertData(body)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }

    return responseHelper.sendSuccessData(res, result, 201)
})

router.put('/:id', validationMiddleware(provincesSchema.update, 'body'), async (req, res, next) => {
    const { params, body } = req
    const conditions = { id: params.id }
    const result = await provincesController.updateData(body, conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

router.delete('/:id', validationMiddleware(provincesSchema.detail, 'params'), async (req, res, next) => {
    const { params } = req
    const conditions = { id: params.id }
    const result = await provincesController.deleteData(conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

module.exports = router
