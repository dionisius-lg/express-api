const dbQueryHelper = require('./../helper/db_query')
const responseHelper = require('./../helper/response')
const table = 'users'


exports.getAll = async (conditions) => {
    let customConditions = []
    const columnDeselect = ['password'] // will not be provide in return
    const conditionTypes = {
        'like': ['username', 'fullname', 'email'],
        'date': []
    }
    const customColumns = [
        `user_levels.name AS user_level`,
    ]
    const join = [
        `LEFT JOIN user_levels ON user_levels.id = ${table}.user_level_id`,
    ]

    if (conditions.alias_id !== undefined) {
        customConditions.push(`id = ${conditions.alias_id}`)
    }

    const data = await dbQueryHelper.getAll({ table, customColumns, join, conditions, customConditions, conditionTypes, columnDeselect })

    return data
}

exports.getDetail = async (conditions) => {
    let customConditions = []

    const customColumns = [
        `user_levels.name AS user_level`
    ]

    const join = [
        `LEFT JOIN user_levels ON user_levels.id = ${table}.user_level_id`
    ]

    const columnSelect = []
    const columnDeselect = [] // will not be provide in return

    const conditionTypes = {
        'like': ['username', 'email'],
        'date': ['birth_date']
    }

    const data = await dbQueryHelper.getDetail({
        table,
        conditions,
        customConditions,
        customColumns,
        join,
        columnSelect,
        columnDeselect,
        conditionTypes
    })

    return data
}

exports.insertData = async (data) => {
    const protectedColumns = ['id']
    const result = await dbQueryHelper.insertData({table, data, protectedColumns})
    
    return result
}

exports.updateData = async (data, conditions) => {
    const protectedColumns = ['id']
    const result = await dbQueryHelper.updateData({table, data, conditions})
    
    return result
}

exports.deleteData = async (conditions) => {
    const protectedColumns = ['id']
    const result = await dbQueryHelper.deleteData({table, conditions})
    
    return result
}
