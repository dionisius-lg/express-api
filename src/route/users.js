const router = require('express').Router()
const bcrypt = require('bcrypt')
const _ = require('lodash')
const responseHelper = require('./../helper/response')
const validationMiddleware = require('./../middleware/validation')
const usersController = require('./../controller/users')
const usersSchema = require('./../schema/users')

router.get('/', async (req, res, next) => {
    const conditions = req.query
    const result = await usersController.getAll(conditions)

    return responseHelper.sendSuccessData(res, result)
})

router.get('/:id', validationMiddleware(usersSchema.detail, 'params'), async (req, res, next) => {
    const conditions = { id: req.params.id }
    const result = await usersController.getDetail(conditions)

    if (result.data === false) {
        return responseHelper.sendNotFoundData(res, result)
    }

    if ('password' in result.data) {
        delete result.data['password']
    }

    return responseHelper.sendSuccessData(res, result)
})

router.post('/', validationMiddleware(usersSchema.create, 'body'), async (req, res, next) => {
    let body = req.body
    let hashPassword = bcrypt.hashSync(body.username, 10)
    body.password = hashPassword

    const result = await usersController.insertData(body)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }

    return responseHelper.sendSuccessData(res, result, 201)
})


router.put('/:id', validationMiddleware(usersSchema.update, 'body'), async (req, res, next) => {
    let conditions = { id: req.params.id }
    let body = req.body

    if (typeof body.password !== "undefined") {
        let hashPassword = bcrypt.hashSync(body.password, 10)
        body.password = hashPassword

    }

    const result = await usersController.updateData(body, conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})


router.delete('/:id', validationMiddleware(usersSchema.detail, 'body'), async (req, res, next) => {
    let conditions = { id: req.params.id }

    const result = await usersController.deleteData(conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

module.exports = router
