const router = require('express').Router()
const moment = require('moment-timezone')
const config = require('./../config')
const validationMiddleware = require('./../middleware/validation')
const responseHelper = require('./../helper/response')
const productCategoriesController = require('./../controller/product_categories')
const productCategoriesSchema = require('./../schema/product_categories')

moment.tz.setDefault(config.timezone)

router.get('/', async (req, res, next) => {
    const { query } = req
    const result = await productCategoriesController.getAll(query)

    return responseHelper.sendSuccessData(res, result)
})

router.get('/:id', validationMiddleware(productCategoriesSchema.detail, 'params'), async (req, res, next) => {
    const { params } = req
    const conditions = { id: params.id }
    const result = await productCategoriesController.getDetail(conditions)

    if (result.data === false) {
        return responseHelper.sendNotFoundData(res, result)
    }

    return responseHelper.sendSuccessData(res, result)
})

router.post('/', validationMiddleware(productCategoriesSchema.create, 'body'), async (req, res, next) => {
    const { body, decoded } = req

    if (typeof body.created_date === 'undefined') {
        body.created_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }

    if (typeof body.created_user_id === 'undefined') {
        body.created_user_id = decoded.id
    }

    const result = await productCategoriesController.insertData(body)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }

    return responseHelper.sendSuccessData(res, result, 201)
})

router.put('/:id', validationMiddleware(productCategoriesSchema.update, 'body'), async (req, res, next) => {
    const { params, body, decoded } = req

    if (typeof body.updated_date === 'undefined') {
        body.updated_date = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    }

    if (typeof body.updated_user_id === 'undefined') {
        body.updated_user_id = decoded.id
    }

    const conditions = { id: params.id }
    const result = await productCategoriesController.updateData(body, conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

router.delete('/:id', validationMiddleware(productCategoriesSchema.detail, 'params'), async (req, res, next) => {
    const { params } = req
    const conditions = { id: params.id }
    const result = await productCategoriesController.deleteData(conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

module.exports = router
