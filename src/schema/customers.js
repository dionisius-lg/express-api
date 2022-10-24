const Joi = require('joi').extend(require('@joi/date'))

const schema = {
    detail: Joi.object().keys({ 
        id: Joi.number().min(1).required()
    }),
    create: Joi.object().keys({
        fullname: Joi.string().min(3).max(100).regex(/^[a-zA-Z0-9 ]*$/).error(err => {
            err.forEach(i => {
                if (i.code === 'string.pattern.base') {
                    i.message = `"${i.local.key}" format is invalid.`
                }
            })

            return err
        }).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().max(25).allow(null).allow(''),
        address: Joi.string().max(200).regex(/^[a-zA-Z0-9 .,\/\-]*$/).error(err => {
            err.forEach(i => {
                if (i.code === 'string.pattern.base') {
                    i.message = `"${i.local.key}" format is invalid.`
                }
            })

            return err
        }).allow(null).allow(''),
        created_date: Joi.any().strip(),
        created_user_id: Joi.any().strip(),
        updated_date: Joi.any().strip(),
        updated_user_id: Joi.any().strip(),
        is_active: Joi.any().strip(),
    }),
    update: Joi.object().keys({
        fullname: Joi.string().min(3).max(100).regex(/^[a-zA-Z0-9 ]*$/).error(err => {
            err.forEach(i => {
                if (i.code === 'string.pattern.base') {
                    i.message = `"${i.local.key}" format is invalid.`
                }
            })

            return err
        }).allow(null).allow(''),
        email: Joi.string().email().allow(null).allow(''),
        phone: Joi.string().max(25).allow(null).allow(''),
        address: Joi.string().max(200).regex(/^[a-zA-Z0-9 .,\/\-]*$/).error(err => {
            err.forEach(i => {
                if (i.code === 'string.pattern.base') {
                    i.message = `"${i.local.key}" format is invalid.`
                }
            })

            return err
        }).allow(null).allow(''),
        created_date: Joi.any().strip(),
        created_user_id: Joi.any().strip(),
        updated_date: Joi.any().strip(),
        updated_user_id: Joi.any().strip(),
        is_active: Joi.string().valid('0','1').allow(null).allow(''),
    }),
} 

module.exports = schema
