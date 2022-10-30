const dbQueryHelper = require('./../helper/db_query')
const table = 'users'


exports.getAll = async (conditions) => {
    const conditionTypes = {
        'like': ['username', 'fullname', 'email'],
        'date': []
    }

    let customConditions = []

    if (typeof conditions.idx !== 'undefined') {
        customConditions.push(`${table}.id <> '${conditions.idx}'`)
    }

    const columnSelect = [

    ]

    const columnDeselect = [
        'password'
    ]

    const customColumns = [
        `cities.name AS city`,
        `provinces.name AS province`,
        `user_levels.name AS user_level`,
        `created_users.fullname AS created_user`,
        `updated_users.fullname AS updated_user`,
    ]

    const join = [
        `LEFT JOIN cities ON cities.id = ${table}.city_id`,
        `LEFT JOIN provinces ON provinces.id = ${table}.province_id`,
        `LEFT JOIN user_levels ON user_levels.id = ${table}.user_level_id`,
        `LEFT JOIN users AS created_users ON created_users.id = ${table}.created_user_id`,
        `LEFT JOIN users AS updated_users ON updated_users.id = ${table}.updated_user_id`,
    ]

    const groupBy = [
        `${table}.id`
    ]

    const having = []

    const customOrders = []

    const data = await dbQueryHelper.getAll({ table, conditions, conditionTypes, customConditions, columnSelect, columnDeselect, customColumns, join, groupBy, having, customOrders })

    return data
}

exports.getDetail = async (conditions) => {
    let customConditions = []

    if (typeof conditions.idx !== 'undefined') {
        customConditions.push(`${table}.id <> '${conditions.idx}'`)
    }

    const columnSelect = []

    const columnDeselect = [
        // 'password'
    ]

    const customColumns = [
        `cities.name AS city`,
        `provinces.name AS province`,
        `user_levels.name AS user_level`,
        `created_users.fullname AS created_user`,
        `updated_users.fullname AS updated_user`,
    ]

    const join = [
        `LEFT JOIN cities ON cities.id = ${table}.city_id`,
        `LEFT JOIN provinces ON provinces.id = ${table}.province_id`,
        `LEFT JOIN user_levels ON user_levels.id = ${table}.user_level_id`,
        `LEFT JOIN users AS created_users ON created_users.id = ${table}.created_user_id`,
        `LEFT JOIN users AS updated_users ON updated_users.id = ${table}.updated_user_id`,
    ]

    const data = await dbQueryHelper.getDetail({ table, conditions, customConditions, columnSelect, columnDeselect, customColumns, join })

    return data
}

exports.insertData = async (data) => {
    const protectedColumns = ['id']
    const result = await dbQueryHelper.insertData({table, data, protectedColumns})
    
    return result
}

exports.updateData = async (data, conditions) => {
    const protectedColumns = ['id']
    const result = await dbQueryHelper.updateData({table, data, protectedColumns, conditions})
    
    return result
}

exports.deleteData = async (conditions) => {
    const result = await dbQueryHelper.deleteData({table, conditions})
    
    return result
}
