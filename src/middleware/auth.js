const _ = require('lodash')
const jwt = require('jsonwebtoken')
const jwtConfig = require('./../config').jwt
const responseHelper = require('./../helper/response')

/**
 * authenticate JWT token
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next method
 */
exports.authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (authHeader) {
        const token = authHeader.split(' ')[1]
        const options = {
            algorithms: [jwtConfig.algorithm]
        }

        jwt.verify(token, jwtConfig.key, options, (err, decoded) => {
            if (err) {
                return responseHelper.sendUnauthorized(res)
            }

            req.decoded = decoded
            next()
        })
    } else {
        return responseHelper.sendForbidden(res)
    }
}

/**
 * Verify JWT refresh token
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Object} next - Express next method
 */
 exports.authenticateJWTRefresh = (req, res, next) => {
    const { socket, headers } = req
    const authHeader = headers['authorization']

    if (authHeader) {
        const token = authHeader.split(' ')[1]
        const options = {
            algorithms: [jwtConfig.algorithm]
        }

        jwt.verify(token, jwtConfig.keyRefresh, options, (err, decoded) => {
            if (err) {
                return responseHelper.sendUnauthorized(res)
            }

            req.decoded = decoded
            next()
        })
    } else {
        return responseHelper.sendForbidden(res)
    }
}
