const Joi = require('joi').extend(require('@joi/date'))

const schema = {
    detail: Joi.object().keys({ 
        id: Joi.number().min(1).required()
    }),
    create: Joi.object().keys({
        name: Joi.string().min(3).max(100).regex(/^[a-zA-Z0-9 ]*$/).error(err => {
            err.forEach(i => {
                if (i.code === 'string.pattern.base') {
                    i.message = `"${i.local.key}" format is invalid.`
                }
            })

            return err
        }).required(),
        is_active: Joi.any().strip(),
    }),
    update: Joi.object().keys({
        name: Joi.string().min(3).max(100).regex(/^[a-zA-Z0-9 ]*$/).error(err => {
            err.forEach(i => {
                if (i.code === 'string.pattern.base') {
                    i.message = `"${i.local.key}" format is invalid.`
                }
            })

            return err
        }).allow(null).allow(''),
        is_active: Joi.string().valid('0','1').allow(null).allow(''),
    }),
} 

module.exports = schema
