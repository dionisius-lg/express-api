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
        product_category_id: Joi.string().min(1),
        created_date: Joi.any().strip(),
        created_user_id: Joi.any().strip(),
        updated_date: Joi.any().strip(),
        updated_user_id: Joi.any().strip(),
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
        product_category_id: Joi.string().min(1).allow(null).allow(''),
        created_date: Joi.any().strip(),
        created_user_id: Joi.any().strip(),
        updated_date: Joi.any().strip(),
        updated_user_id: Joi.any().strip(),
        is_active: Joi.string().valid('0','1').allow(null).allow(''),
    }),
} 

module.exports = schema
