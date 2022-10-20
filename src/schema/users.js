const Joi = require('joi').extend(require('@joi/date'))

const schema = {
    detail: Joi.object().keys({ 
        id: Joi.number().min(1).required()
    }),
    create: Joi.object().keys({
        username: Joi.string().min(3).max(20).regex(/^[a-zA-Z0-9_]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" format is invalid.`
                }
            })

            return errs
        }).required(),
        password: Joi.string().min(3).max(20),
        email: Joi.string().email().required(),
        fullname: Joi.string().min(3).max(100).regex(/^[a-zA-Z0-9 ]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" format is invalid.`
                }
            })

            return errs
        }).required(),
        birth_place: Joi.string().min(3).max(50).regex(/^[a-zA-Z0-9 ]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" format is invalid.`
                }
            })

            return errs
        }).allow(null).allow(''),
        birth_date: Joi.date().format('YYYY-MM-DD').utc().allow(null).allow(''),
        phone: Joi.string().max(25).allow(null).allow(''),
        address: Joi.string().max(200).regex(/^[a-zA-Z0-9 .,\/\-]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" format is invalid.`
                }
            })

            return errs
        }).allow(null).allow(''),
        zip_code: Joi.string().max(6).regex(/^[0-9]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" numeric only.`
                }
            })

            return errs
        }).allow(null).allow(''),
        city_id: Joi.number().min(1).allow(null).allow(''),
        province_id: Joi.number().min(1).allow(null).allow(''),
        user_level_id: Joi.string().min(1),
        verification_code: Joi.any().strip(),
        create_date: Joi.any().strip(),
        create_user_id: Joi.any().strip(),
        update_date: Joi.any().strip(),
        update_user_id: Joi.any().strip(),
        is_password_request: Joi.any().strip(),
        is_active: Joi.any().strip(),
    }),
    update: Joi.object().keys({
        username: Joi.string().min(3).max(20).regex(/^[a-zA-Z0-9_]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" format is invalid.`
                }
            })

            return errs
        }).allow(null).allow(''),
        password: Joi.string().min(3).max(20).allow(null).allow(''),
        email: Joi.string().email().allow(null).allow(''),
        fullname: Joi.string().min(3).max(100).regex(/^[a-zA-Z0-9 ]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" format is invalid.`
                }
            })

            return errs
        }).allow(null).allow(''),
        birth_place: Joi.string().min(3).max(50).regex(/^[a-zA-Z0-9 ]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" format is invalid.`
                }
            })

            return errs
        }).allow(null).allow(''),
        birth_date: Joi.date().format('YYYY-MM-DD').raw().allow(null).allow(''),
        phone: Joi.string().max(25).allow(null).allow(''),
        address: Joi.string().max(200).regex(/^[a-zA-Z0-9 .,\/\-]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" format is invalid.`
                }
            })

            return errs
        }).allow(null).allow(''),
        zip_code: Joi.string().max(6).regex(/^[0-9]*$/).error(errs => {
            errs.forEach(err => {
                if (err.code === 'string.pattern.base') {
                    err.message = `"${err.local.key}" numeric only.`
                }
            })

            return errs
        }).allow(null).allow(''),
        city_id: Joi.number().min(1).allow(null).allow(''),
        province_id: Joi.number().min(1).allow(null).allow(''),
        user_level_id: Joi.string().min(1).allow(null).allow(''),
        verification_code: Joi.any().strip(),
        create_date: Joi.any().strip(),
        create_user_id: Joi.any().strip(),
        update_date: Joi.any().strip(),
        update_user_id: Joi.any().strip(),
        is_password_request: Joi.string().valid('0','1').allow(null).allow(''),
        is_active: Joi.string().valid('0','1').allow(null).allow(''),
    }),
} 

module.exports = schema
