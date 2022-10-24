const dbQueryHelper = require('./../helper/db_query')
const table = 'cities'


exports.getAll = async (conditions) => {
    const conditionTypes = {
        'like': ['name'],
        'date': []
    }

    let customConditions = []

    if (typeof conditions.idx !== 'undefined') {
        customConditions.push(`${table}.id <> '${conditions.idx}'`)
    }

    if (typeof conditions.province !== 'undefined') {
        customConditions.push(`provinces.name LIKE '%${conditions.province}%'`)
    }

    const columnSelect = [

    ]

    const columnDeselect = [
        
    ]

    const customColumns = [
        `provinces.name AS province`,
    ]

    const join = [
        `LEFT JOIN provinces ON provinces.id = ${table}.province_id`,
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
        `provinces.name AS province`,
    ]

    const join = [
        `LEFT JOIN provinces ON provinces.id = ${table}.province_id`,
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
