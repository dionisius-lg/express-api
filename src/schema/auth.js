const Joi = require('joi').extend(require('@joi/date'))

const schema = {
    token: Joi.object().keys({ 
        username: Joi.string().required(),
        password: Joi.string().required(),
    }),
    refresh_token: Joi.object().keys({ 
        token: Joi.string().required(),
    }),
}

module.exports = schema
