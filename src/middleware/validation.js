const fs = require('fs')
const _ = require('lodash')
const responseHelper = require('./../helper/response')

/**
 * Validation for given schema
 * @param  {Object} schema - schema object screnario and message
 * @param  {string} property - request property. @example 'body', 'params'
 */
const validation = (schema, property) => { 
	return (req, res, next) => {
        const validate = schema.validate(req[property], {
            abortEarly: false,
            convert: true
        })

        const { error, value } = validate

        if (error) {
            const { details } = error
            const message = details.map(i => i.message).join(', ')

            return responseHelper.sendBadRequest(res, message)
        }

        let reqBody = {}

        Object.keys(value).forEach((key) => {
            if (!_.isEmpty(value[key])) {
                reqBody[key] = value[key]
            }
        })

        req.body = reqBody
        next()
	} 
}

module.exports = validation
