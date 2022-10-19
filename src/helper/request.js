const _ = require('lodash')

/**
 * Remove invalid column from object
 * @param  {Object} object - Raw data column
 * @param  {string[]} keys - Data column to be keep
 */
exports.filterColumn = (object = {}, keys = []) => {
    Object.keys(object).forEach(function(key) {
        if(keys.indexOf(key) == -1) {
            delete object[key]
        }
    })
}

/**
 * Remove invalid data from object
 * @param  {Object} object - Raw data
 */
exports.filterData = (object = {}) => {
    Object.keys(object).forEach(function(key) {
        if(object[key] === undefined || (_.trim(object[key]) === '' && object[key] !== null)) {
            delete object[key]
        }
    })
}

/**
 * Return new valid object value
 * @param  {Object} object
 * @param  {string[]} parameters
 * @returns {Object}
 */
exports.filterParam = (object = {}, parameters = []) => {
    let options = {}

    parameters.forEach(function(param) {
        if (object[param] !== undefined || object[param] !== '') {
            options[param] = object[param]
        }
    })

    return options
}
