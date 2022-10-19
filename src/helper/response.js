const _ = require('lodash')
const moment = require('moment-timezone')
const config = require('./../config')

moment.tz.setDefault(config.timezone)

/**
 * OK 200
 * @param {Object} res
 * @param {Object} data
 * @param {Number} code
 * @returns {Object} JSON object
 */
exports.sendSuccessData = function (res, data, code = false) {
    let result = {
        request_time: moment().unix(),
        response_code: 200,
        success: true,
        total_data: data.total_data || 0,
        data: data.data || {},
    }
    
    if (data.limit > 0 && data.total_data > 0) {
        const page_current = _.toInteger(data.page)
        const page_next = page_current + 1
        const page_previous = page_current - 1
        const page_first = 1
        const page_last = _.ceil(data.total_data/data.limit)

        result.paging = {
            current: page_current,
            next: (page_next <= page_last) ? page_next : page_current,
            previuos: (page_previous > 0) ? page_previous : 1,
            first: page_first,
            last: (page_last > 0) ? page_last : 1
        }
    }

    if (code && [200, 201].includes(code)) {
        result.response_code = code
    }

    return res.status(result.response_code).send(result)
}

/**
 * Error 400
 * @param {Object} res
 * @param {string} message
 * @returns {Object} JSON object
 */
exports.sendBadRequest = function (res, message = false) {
    let result = {
        request_time: moment().unix(),
        response_code: 400,
        success: false,
        title: 'Bad Request',
        message: message || 'Resource Not Found'
    }

    return res.status(result.response_code).send(result)
}

/**
 * Error 401
 * @param {Object} res
 * @param {string} message
 * @returns {Object} JSON object
 */
exports.sendUnauthorized = function (res, message = false) {
    let result = {
        request_time: moment().unix(),
        response_code: 401,
        success: false,
        title: 'Unauthorized',
        message: message || 'Unauthorized'
    }

    return res.status(result.response_code).send(result)
}

/**
 * Error 403
 * @param {Object} res
 * @returns {Object} JSON object
 */
exports.sendForbidden = function (res) {
    let result = {
        request_time: moment().unix(),
        response_code: 403,
        success: false,
        title: 'Forbidden',
        message: 'You do not have rights to access this resource'
    }

    return res.status(result.response_code).send(result)
}

/**
 * Error 404 Data Not Found
 * @param {Object} res
 * @returns {Object} JSON object
 */
 exports.sendNotFoundData = function (res) {
    let result = {
        request_time: moment().unix(),
        response_code: 404,
        success: false,
        title: 'Not Found',
        message: 'Data Not Found'
    }

    return res.status(result.response_code).send(result)
}

/**
 * Error 404 Data Not Found Resource
 * @param {Object} res
 * @returns {Object} JSON object
 */
 exports.sendNotFoundResource = function (res) {
    let result = {
        request_time: moment().unix(),
        response_code: 404,
        success: false,
        title: 'Not Found',
        message: 'Resource Not Found'
    }

    return res.status(result.response_code).send(result)
}

/**
 * Error 405
 * @param {Object} res
 * @returns {Object} JSON object
 */
 exports.sendMethodNotAllowed = function (res) {
    let result = {
        request_time: moment().unix(),
        response_code: 405,
        success: false,
        title: 'Method Not Allowed',
        message: 'This resource is not match with your request method'
    }

    return res.status(result.response_code).send(result)
}

/**
 * Error 500
 * @param {Object} res
 * @returns {Object} JSON object
 */
 exports.sendInternalServerError = (res) => {
    let result = {
        request_time: moment().unix(),
        response_code: 500,
        success: false,
        title: 'Internal Server Error',
        message: 'The server encountered an error, please try again later'
    }

    return res.status(result.response_code).send(result)
}
