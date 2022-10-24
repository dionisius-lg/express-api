const _ = require('lodash')
const jwt = require('jsonwebtoken')
const ms = require('ms')
const moment = require('moment-timezone')
const config = require('./../config')
const { key, keyRefresh, algorithm, live, expire, expireRefresh } = config.jwt
const dbQueryHelper = require('./../helper/db_query')
const table = 'refresh_tokens'

moment.tz.setDefault(config.timezone)

exports.createToken = (data = { id: '', ip_address: '', user_agent: '' }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }

        let now = new Date()
        let expireMilSeconds = ms(expire)
        let expireSeconds = Math.floor(expireMilSeconds / 1000)
        // add jwt expire
        let addExpireSeconds = now.getSeconds() + _.toInteger(expireSeconds)
        now.setSeconds(addExpireSeconds)
        let timestamp = now.getTime()
        let expireDate = moment(timestamp).format('YYYY-MM-DD HH:mm:ss')
        const refresh = await createRefreshToken(data)
        const options = {
            expiresIn: expire, 
            algorithm: algorithm
        }

        jwt.sign(data, key, options, async (err, token) => {
            if (err) {
                return resolve(res)
            }

            data.token = token
            data.token_expires_in = expireDate
            data.refresh_token = refresh.token
            data.refresh_token_expires_in = refresh.expireDate

            // register refresh token
            const dataRegister = [
                { 
                    user_id: data.id, 
                    user_agent: _.replace(data.user_agent, ' ', ''),
                    ip_address: data.ip_address,
                    token: data.token,
                    expired: data.token_expires_in,
                    updated: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                }
            ]

            const register = await dbQueryHelper.insertDuplicateUpdateData({ table, data: dataRegister})

            if (register !== false) {
                delete data.ip_address
                delete data.user_agent

                res = {
                    total_data: 1,
                    limit: 0,
                    page: 1,
                    data: data
                }
            }

            resolve(res)
        })
    })
}

const createRefreshToken = (data = { id: '', ip_address: '', user_agent: '' }) => {
    return new Promise((resolve, reject) => {
        let res = {
            token: '',
            expireDate: ''
        }

        let now = new Date()
        let expireMilSeconds = ms(expireRefresh)
        let expireSeconds = Math.floor(expireMilSeconds / 1000)
        // add jwt expire
        let addExpireSeconds = now.getSeconds() + _.toInteger(expireSeconds)
        now.setSeconds(addExpireSeconds)
        let timestamp = now.getTime()
        let expireDate = moment(timestamp).format('YYYY-MM-DD HH:mm:ss')
        const options = {
            expiresIn: expireRefresh,
            algorithm: algorithm
        }

        jwt.sign(data, keyRefresh, options, async (err, token) => {
            if (err) {
                return resolve(res)
            }

            res = {
                token: token,
                expireDate: expireDate
            }

            return resolve(res)
        })
    })
}

exports.checkToken = async (conditions) => {
    const data = await dbQueryHelper.getDetail({ table, conditions })

    return data
}
