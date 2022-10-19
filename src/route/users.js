const router = require('express').Router()
const bcrypt = require('bcrypt')
const _ = require('lodash')
const responseHelper = require('./../helper/response')
const usersController = require('./../controller/users')

router.get('/', async (req, res, next) => {
    const conditions = req.query
    const result = await usersController.getAll(conditions)

    return responseHelper.sendSuccessData(res, result)
})

router.get('/:id', async (req, res, next) => {
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

router.post('/', async (req, res, next) => {
    let body = req.body
    let hashPassword = bcrypt.hashSync(body.username, 10)
    body.password = hashPassword

    const result = await usersController.insertData(body)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }

    return responseHelper.sendSuccessData(res, result, 201)
})

router.put('/:id', async (req, res, next) => {
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

router.delete('/:id', async (req, res, next) => {
    let conditions = { id: req.params.id }

    const result = await usersController.deleteData(conditions)

    if (result.data === false) {
        return responseHelper.sendBadRequest(res, 'Invalid Data')
    }


    return responseHelper.sendSuccessData(res, result)
})

module.exports = router
