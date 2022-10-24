const dbQueryHelper = require('./../helper/db_query')
const table = 'customers'


exports.getAll = async (conditions) => {
    const conditionTypes = {
        'like': ['name'],
        'date': []
    }

    let customConditions = []

    if (typeof conditions.idx !== 'undefined') {
        customConditions.push(`${table}.id <> '${conditions.idx}'`)
    }

    const columnSelect = [

    ]

    const columnDeselect = [
        
    ]

    const customColumns = [
        `created_users.fullname AS created_user`,
        `updated_users.fullname AS updated_user`,
    ]

    const join = [
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

    const columnDeselect = []

    const customColumns = [
        `created_users.fullname AS created_user`,
        `updated_users.fullname AS updated_user`,
    ]

    const join = [
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
