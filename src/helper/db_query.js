const _ = require('lodash')
const moment = require('moment-timezone')
const config = require('./../config')
const dbConn = require('../config/database')
const requestHelper = require('./request')

moment.tz.setDefault(config.timezone)


/**
 * Return table columns
 * @param  {string} [db = config.db.name] - Database's name
 * @param  {string} table - Table's name
 * @returns {Promise.<string[]>} Array of selected table's column name
 */
exports.checkColumn = ({ db = config.db.name, table = '' }) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${db}' AND TABLE_NAME = '${table}'`
        dbConn.query(query, (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return
            }

            const columns = results.map(function (c) {
                return c.COLUMN_NAME
            })

            resolve(columns)
        })
    })
}

/**
 * Return table custom fields
 * @param  {string} table - Table's name
 * @returns {Promise.<string[]>} Array of object selected table's custom field name
 */
exports.checkCustomField = ({table = '' }) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM custom_fields WHERE is_active = 1 AND source_table = '${table}'`
        dbConn.query(query, (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return
            }

            const columns = results.map(function (c) {
                //let fields = {}
                return {'field_key': c.field_key, 'field_type_id': c.field_type_id}
            })

            resolve(columns)
        })
    })
}

/**
 * Return total data
 * @param  {string} table - Table's name
 * @param  {Object.<string, string|number>} conditions - Query conditions. @example {columnName: 'columnValue'}
 * @param  {Object.<string, string[]>} [conditionTypes={ 'like': [], 'date': [] }] - Condition option for certain table field. 'like' field will be treated with 'LIKE' condition. 'date' field will be treated with 'DATE()' function inside query condition
 * @param  {string[]} customConditions - custom query condition. @example ['tableA.columnTableA = "someValue"']
 * @param  {string} attributeColumn - custom attribute column name in selected table.
 * @param  {string[]} customFields - custom fields in selected table. @example ['customField1', 'customField2']
 * @param  {string[]} customDropdownFields - custom fields with dropdown type in selected table. @example ['customField1', 'customField2']
 * @param  {Object.<string>} join - JOIN query statement. @example {'JOIN tableB ON tableB.id = tableA.table_b_id'}
 * @param  {Object.<string>} groupBy - GROUP BY query statement. @example {'columnA'}
 * @param  {Object.<string>} having - HAVING query statement. groupBy param required. @example {'COUNT(columA) > 1'}
 * @returns {Promise.<number|Object.<string, number|boolean>>} total data of given table and condition
 */
exports.countData = ({ table = '', conditions = {}, conditionTypes = { 'like': [], 'date': [] }, customConditions = [], attributeColumn = '', customFields = {}, customDropdownFields = {}, customAttribute = {}, join = {}, groupBy = {}, having = {} }) => {
    return new Promise((resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }
        let setCond = []
        let setCustomCond = []
        let queryCond = ''
        let query = `SELECT COUNT(*) AS count FROM ${table}`
        let queryCount = ''

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery = _.join(join, ' ')
            query += ` ${joinQuery}`
        }
        
        if (!_.isEmpty(conditions)) {
            for (key in conditions) {
                if (!_.isEmpty(conditionTypes)) {
                    if (_.indexOf(conditionTypes.date, key) >= 0) {
                        const d = new Date()
                        const dateVal = (_.toNumber(conditions[key]) > 0) ? dateFormat(conditions[key] * 1000, 'yyyy-mm-dd') : dateFormat(d, 'yyyy-mm-dd')
                        setCond.push(`DATE(${table}.${key}) = ${dbConn.escape(dateVal)}`)
                    } else if (_.indexOf(conditionTypes.like, key) >= 0) {
                        let keyLike = `%${conditions[key]}%`
                        setCond.push(`${table}.${key} LIKE ${dbConn.escape(keyLike)}`)
                    } else {
                        let is_array = conditions[key].constructor === Array
                        
                        if (is_array) {
                            setCond.push(`${table}.${key} IN (${dbConn.escape(conditions[key])})`)
                        } else {
                            setCond.push(`${table}.${key} = ${dbConn.escape(conditions[key])}`)
                        }
                    }
                } else {
                    let is_array = conditions[key].constructor === Array
                        
                    if (is_array) {
                        setCond.push(`${table}.${key} IN (${dbConn.escape(conditions[key])})`)
                    } else {
                        setCond.push(`${table}.${key} = ${dbConn.escape(conditions[key])}`)
                    }
                }
            }
            
            queryCond = _.join(setCond, ' AND ')
            query += ` WHERE ${queryCond}`
        }
        
        if (!_.isEmpty(attributeColumn)) {
            // for custom attributes
            let queryLine

            if (!_.isEmpty(customAttribute)) {
                for (key in customAttribute) {
                    if (_.indexOf(customDropdownFields, key) >= 0) {
                        queryLine = `JSON_EXTRACT(${table}.${attributeColumn}, '$.${key}.id') = ${dbConn.escape(customAttribute[key])}`
                    } else {
                        queryLine = `JSON_EXTRACT(${table}.${attributeColumn}, '$.${key}') = ${dbConn.escape(customAttribute[key])}`
                    }

                    setCustomCond.push(queryLine)
                }

                queryCond = _.join(setCustomCond, ' AND ')
                
                if (!_.isEmpty(conditions)) {
                    query += ` AND ${queryCond}`      
                } else {
                    query += ` WHERE ${queryCond}`
                }
            }
        }

        if (!_.isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ' WHERE ' + _.join(customConditions, ' AND ')

            if (!_.isEmpty(conditions)) {
                queryCond = ' AND ' + _.join(customConditions, ' AND ')
            }

            query += `${queryCond}`
        }

        if (!_.isEmpty(groupBy) && _.isArrayLikeObject(groupBy)) {
            let columnGroup = _.join(groupBy, ', ')
            query += ` GROUP BY ${columnGroup}`

            if (!_.isEmpty(having) && _.isArrayLikeObject(having)) {
                let havingClause = _.join(having, ' AND ')
                query += ` HAVING ${havingClause}`
            }

            queryCount = `SELECT COUNT(*) AS count FROM (${query}) AS count`
            query = queryCount
        }
        
        dbConn.query(query, (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return resolve(res)
            }

            const data = results[0].count

            resolve(data)
        })
    })
}

/**
 * SELECT query
 * @param  {string} table - Table's name
 * @param  {Object.<string, string|number>} conditions - Query conditions. @example {columnName: 'columnValue'}
 * @param  {Object.<string, string[]>} [conditionTypes={ 'like': [], 'date': [] }]  - Condition option for certain table field. 'like' field will be treated with 'LIKE' condition. 'date' field will be treated with 'DATE()' function inside query condition
 * @param  {string[]} customConditions - custom query condition. @example ['tableA.columnTableA = "someValue"']
 * @param  {Object.<string>} columnSelect - custom column to select. @example {'columnA', 'columnB'}
 * @param  {Object.<string>} columnDeselect - custom column to deselect. @example {'columnA', 'columnB'}
 * @param  {string[]} customColumns - custom column from join table. @example ['tableB.columnTableB AS newUniqueColumn']
 * @param  {Object.<string>} join - JOIN query statement. @example {'JOIN tableB ON tableB.id = tableA.table_b_id'}
 * @param  {Object.<string>} customOrders - custom ORDER BY query statement. @example {'CASE tableA.ticket_status_id WHEN 1 THEN tableA.columnA ELSE tableA.columnB END ASC, tableA.columnA'}
 * @param  {string} attributeColumn - custom attribute column name in selected table.
 * @param  {Object.<string>} groupBy - GROUP BY query statement. @example {'columnA'}
 * @param  {Object.<string>} having - HAVING query statement. groupBy param required. @example {'COUNT(columA) > 1'}
 * @param  {string} cacheKey - set key for Redis. if empty, table name will be used as the key
 * @returns {Promise.<Object.<string, string|number|boolean|Object>>} - data result
 */
exports.getAll = ({ table = '', conditions = {}, conditionTypes = { 'like': [], 'date': [] }, customConditions = [], columnSelect = {}, columnDeselect = {}, customColumns = [], attributeColumn = '', join = {}, groupBy = {}, customOrders = {}, having = {}, cacheKey = '' }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }
        let columns = await this.checkColumn({ table })
        const masterColumns = columns
        let column = ''
        const customAttribute = { ... conditions }
        const sortData = ['ASC', 'DESC']
        let order = (!_.isEmpty(conditions.order)) ? conditions.order : columns[0]
        order = (_.indexOf(columns, order) >= 0) ? order : columns[0]
        
        if (conditions.order == false) {
            order = false;
        }

        const sort = (_.indexOf(sortData, _.toUpper(conditions.sort)) >= 0) ? _.toUpper(conditions.sort) : 'ASC'
        let limit = (conditions.limit > 0) ? conditions.limit : 20
        
        if (conditions.limit == false) {
            limit = false;
        }
        
        let page = (conditions.page > 0) ? conditions.page : 1
        let setCond = []
        let queryCond = ''
        let getCustomFields = []
        let customFields = []
        let customDropdownFields = []

        if (!_.isEmpty(attributeColumn)) {
            getCustomFields = await this.checkCustomField({ table })
            customFields = _.map(getCustomFields, 'field_key')
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 })
            customDropdownFields = _.map(getDropdownColumn, 'field_key')
            requestHelper.filterColumn(customAttribute, customFields)
        }

        if (!_.isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            let validColumn = _.intersection(columnSelect, columns)
            columns = validColumn
        }

        if (!_.isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            if (_.indexOf(columnDeselect, '*') >= 0) {
                // filter data, exclude all columns
                // let selectedColumn = _.difference(columns, deselectedColumn)
                columns = []
            } else {
                // filter data, get column to exclude from valid selected columns or table columns
                let deselectedColumn = _.intersection(columnDeselect, columns)
                // filter data, exclude deselected columns
                let selectedColumn = _.difference(columns, deselectedColumn)
                columns = selectedColumn
            }
        }

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            // give prefix table to table columns
            let prefixColumn = columns.map(function (col) {
                return `${table}.${col}`
            })

            columns = prefixColumn
        }

        column = _.join(columns, ', ')
        
        if (!_.isEmpty(customFields)) {
            let customField = ''
            let setCustomField = []

            for (key in customFields) {
                if (_.indexOf(customDropdownFields, customFields[key]) >= 0) {
                    setCustomField.push(`CONCAT_WS('||', JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}.id')), JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}.value'))) AS ${customFields[key]}`)
                } else {
                    setCustomField.push(`JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}')) AS ${customFields[key]}`)
                }
            }

            customField = _.join(setCustomField, ', ')

            if (!_.isEmpty(column)) {
                column += `, ${customField}`    
            } else {
                column += `${customField}`
            }
        }

        if (!_.isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            if (_.isEmpty(columns)) {
                column += _.join(customColumns, ', ')
            } else {
                column += ', ' + _.join(customColumns, ', ')
            }
        }

        let query = `SELECT ${column} FROM ${table}`

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery = _.join(join, ' ')
            query += ` ${joinQuery}`
        }

        // remove invalid column from conditions
        requestHelper.filterColumn(conditions, masterColumns)
        
        if (!_.isEmpty(conditions)) {
            for (key in conditions) {
                if (!_.isEmpty(conditionTypes)) {
                    if (_.indexOf(conditionTypes.date, key) >= 0) {
                        const d = new Date()
                        const dateVal = (_.toNumber(conditions[key]) > 0) ? dateFormat(conditions[key] * 1000, 'yyyy-mm-dd') : dateFormat(d, 'yyyy-mm-dd')
                        setCond.push(`DATE(${table}.${key}) = ${dbConn.escape(dateVal)}`)
                    } else if (_.indexOf(conditionTypes.like, key) >= 0) {
                        let keyLike = `%${conditions[key]}%`
                        setCond.push(`${table}.${key} LIKE ${dbConn.escape(keyLike)}`)
                    } else {                        
                        let is_array = conditions[key].constructor === Array

                        if (is_array) {
                            setCond.push(`${table}.${key} IN (${dbConn.escape(conditions[key])})`)
                        } else {
                            setCond.push(`${table}.${key} = ${dbConn.escape(conditions[key])}`)
                        }
                    }
                } else {
                    let is_array = conditions[key].constructor === Array
                        
                    if (is_array) {
                        setCond.push(`${table}.${key} IN (${dbConn.escape(conditions[key])})`)
                    } else {
                        setCond.push(`${table}.${key} = ${dbConn.escape(conditions[key])}`)
                    }
                }
            }
        }

        if (!_.isEmpty(attributeColumn)) {
            // for custom attributes
            let queryLine

            for (key in customAttribute) {
                if (customFields.indexOf(key) >= 0) {
                    if (_.indexOf(customDropdownFields, key) >= 0) {
                        queryLine = `JSON_EXTRACT(${table}.${attributeColumn}, '$.${key}.id') = ${dbConn.escape(customAttribute[key])}`
                    } else {
                        queryLine = `JSON_EXTRACT(${table}.${attributeColumn}, '$.${key}') = ${dbConn.escape(customAttribute[key])}`
                    }

                    setCond.push(queryLine)
                }
            }
        }

        queryCond = _.join(setCond, ' AND ')
        query += (!_.isEmpty(queryCond)) ? ` WHERE ${queryCond}` : ''

        if (!_.isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ' WHERE ' + _.join(customConditions, ' AND ')

            if (!_.isEmpty(conditions)) {
                queryCond = ' AND ' + _.join(customConditions, ' AND ')
            }

            query += `${queryCond}`
        }

        if (!_.isEmpty(groupBy) && _.isArrayLikeObject(groupBy)) {
            let columnGroup = _.join(groupBy, ', ')
            query += ` GROUP BY ${columnGroup}`

            if (!_.isEmpty(having) && _.isArrayLikeObject(having)) {
                let havingClause = _.join(having, ' AND ')
                query += ` HAVING ${havingClause}`
            }
        }

        if (!_.isEmpty(customOrders) && _.isArrayLikeObject(customOrders)) {
            query += ` ORDER BY ${customOrders}`
        } else {
            if (order !== undefined && !_.isEmpty(order)) {
                let orderColumn = order

                if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
                    orderColumn = `${table}.${order}`
                }
                query += ` ORDER BY ${orderColumn} ${sort}`
            }
        }

        if (limit > 0) {
            const offset = (limit * page) - limit

            if (_.isInteger(offset) && offset >= 0) {
                query += ` LIMIT ${limit} OFFSET ${offset}`
            } else {
                query += ` LIMIT ${limit}`
            }
        }
        
        let countData = await this.countData({ table, conditions, conditionTypes, customConditions, customAttribute, customFields, customDropdownFields, attributeColumn, join, groupBy, having })

        dbConn.query(query, (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return resolve(res)
            }

            const data = {
                total_data: countData,
                limit: limit,
                page: page,
                data: results
            }

            resolve(data)
        })
    })
}

/**
 * SELECT query for detail specific condition
 * @param  {string} table - Table's name
 * @param  {Object.<string, string|number>} conditions - Query conditions. @example {columnName: 'columnValue'}
 * @param  {string[]} customConditions - custom query condition. @example ['tableA.columnTableA = "someValue"']
 * @param  {Object.<string>} columnSelect - custom column to select. @example {'columnA', 'columnB'}
 * @param  {Object.<string>} columnDeselect - custom column to deselect. @example {'columnA', 'columnB'}
 * @param  {string[]} customColumns - custom column from join table. @example ['tableB.columnTableB AS newUniqueColumn']
 * @param  {string} attributeColumn - custom attribute column name in selected table.
 * @param  {Object.<string>} join - JOIN query statement. @example {'JOIN tableB ON tableB.id = tableA.table_b_id'}
 * @param  {string} cacheKey - set key for Redis. if empty, table name will be used as the key
 * @returns {Promise.<Object.<string, string|number|boolean|Object>>} - data result
 */
exports.getDetail = ({ table = '', conditions = {}, customConditions = [], columnSelect = [], columnDeselect = [], customColumns = [], attributeColumn = '', join = [], cacheKey = '' }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }
        let columns = await this.checkColumn({ table })
        let column = ''
        const customAttribute = { ... conditions }
        let setCond = []
        let queryCond = ''
        let getCustomFields = []
        let customFields = []
        let customDropdownFields = []

        if (!_.isEmpty(attributeColumn)) {
            getCustomFields = await this.checkCustomField({ table })
            customFields = _.map(getCustomFields, 'field_key')
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 })
            customDropdownFields = _.map(getDropdownColumn, 'field_key')
            requestHelper.filterColumn(customAttribute, customFields)
        }
        
        if (!_.isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            let validColumn = _.intersection(columnSelect, columns)
            columns = validColumn
        }

        if (!_.isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            // filter data, get column to exclude from valid selected columns or table columns
            let deselectedColumn = _.intersection(columnDeselect, columns)
            // filter data, exclude deselected columns
            let selectedColumn = _.difference(columns, deselectedColumn)
            columns = selectedColumn
        }

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            let prefixColumn = columns.map(function (col) {
                return `${table}.${col}`
            })

            columns = prefixColumn
        }

        column = _.join(columns, ', ')
        
        if (!_.isEmpty(customFields)) {
            let customField = ''
            let setCustomField = []
            
            for (key in customFields) {
                if (_.indexOf(customDropdownFields, customFields[key]) >= 0) {
                    setCustomField.push(`CONCAT_WS('||', JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}.id')), JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}.value'))) AS ${customFields[key]}`)
                } else {
                    setCustomField.push(`JSON_UNQUOTE(JSON_EXTRACT(${table}.${attributeColumn}, '$.${customFields[key]}')) AS ${customFields[key]}`)
                }
            }

            customField = _.join(setCustomField, ', ')

            if (!_.isEmpty(column)) {
                column += `, ${customField}`    
            } else {
                column += `${customField}`
            }
        }

        if (!_.isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            let append = ''

            if (column) {
                append = ', '
            }

            column += append + _.join(customColumns, ', ')
        }

        let query = `SELECT ${column}`

        if (table) {
            query += ` FROM ${table}`
        } 

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery = _.join(join, ' ')
            query += ` ${joinQuery}`
        }

        if (!_.isEmpty(conditions)) {
            for (key in conditions) {
                let keyCondition = key

                if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
                    keyCondition = `${table}.${key}`
                }

                setCond.push(`${keyCondition} = ${dbConn.escape(conditions[key])}`)
            }

            queryCond = _.join(setCond, ' AND ')

            query += ` WHERE ${queryCond}`
        }

        if (!_.isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            queryCond = ' WHERE ' + _.join(customConditions, ' AND ')

            if (!_.isEmpty(conditions)) {
                queryCond = ' AND ' + _.join(customConditions, ' AND ')
            }

            query += `${queryCond}`
        }

        if (table) {
            query += ` LIMIT 1`
        }

        dbConn.query(query, (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return resolve(res)
            }
            
            if (!_.isEmpty(results)) {
                res = {
                    total_data: 1,
                    limit: 0,
                    page: 1,
                    data: results[0]
                }
            }

            resolve(res)
        })
    })
}

/**
 * INSERT query
 * @param  {string} table - Table's name
 * @param  {Object.<string, string|number>} data - Data to insert. @example {columnName: 'newValue'}
 * @param  {string} attributeColumn - custom attribute column name in selected table
 * @param  {string[]} protectedColumns - Columns to be ignore for insert statement. @example ['columnA', 'columnB']
 * @param  {string[]} cacheKeys - Redis key to be remove. @example {'keyTableA', 'keyTableB'}
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.insertData = ({ table = '', data = {}, attributeColumn = '', protectedColumns = [], cacheKeys = [] }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()']
        let nullChar = ['NULL', '']
        const dataCustom = { ... data }
        const columns = await this.checkColumn({ table })
        // remove invalid column from data
        requestHelper.filterColumn(data, columns)
        // remove invalid data
        requestHelper.filterData(data)

        let getCustomFields
        let customDropdownFields
        let customFields = []
        
        if (!_.isEmpty(attributeColumn)) {
            getCustomFields = await this.checkCustomField({ table })
            customFields = _.map(getCustomFields, 'field_key')
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 })
            customDropdownFields = _.map(getDropdownColumn, 'field_key')
            requestHelper.filterColumn(dataCustom, customFields)
        }

        if (_.isEmpty(data) && _.isEmpty(dataCustom)) {
            // reject('Insert query require some data')
            return resolve(res)
        }
        
        let keys = Object.keys(data)
        // check protected columns on submitted data
        let forbiddenColumns = _.intersection(protectedColumns, keys)

        if (!_.isEmpty(forbiddenColumns)) {
            return resolve(res)
        }
        
        delete keys[attributeColumn]
        
        if (!_.isEmpty(dataCustom) && !_.isEmpty(attributeColumn)) {
            keys.push(attributeColumn)
        }
        
        let column = _.join(keys, ', ')
        
        let query = `INSERT INTO ${table} (${column}) VALUES ?`
        let values = []
        let dataCustomField = {}
        let tempVal = Object.keys(data).map(k => {
            let dataVal = ''

            if (typeof data[k] !== undefined) {
                dataVal = _.trim(data[k])

                if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                    let d = new Date()
                    dataVal = dateFormat(d, 'yyyy-mm-dd HH:MM:ss')
                }

                if (_.indexOf(nullChar, _.toUpper(dataVal)) >= 0) {
                    dataVal = null
                }
            } else {
                dataVal = null
            }

            return dataVal
        })
        
        for (key in dataCustom) {
            if (customFields.indexOf(key) >= 0) {
                if (customDropdownFields.indexOf(key) >= 0) {
                    let dropdownData = dataCustom[key].split('||')
                    let dropdownId = dropdownData[0] || ''
                    let dropdownValue = dropdownData[1] || ''

                    if ((!isNaN(dropdownId) || _.isNumber(dropdownId)) && dropdownId > 0 && !_.isEmpty(dropdownValue)) {
                        dataCustomField[key] = {id: dropdownId, value: dropdownValue}
                    }
                } else {
                    dataCustomField[key] = dataCustom[key]
                }
            }
        }
        
        let jsonDataCustom = JSON.stringify(dataCustomField);

        if (!_.isEmpty(dataCustomField)) {
            tempVal.push(jsonDataCustom)
        }
        
        values.push(tempVal)
        
        dbConn.query(query, [values], (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return resolve(res)
            }

            res = {
                total_data: results.affectedRows,
                data: { id: results.insertId }
            }

            resolve(res)
        })
    })
}

/**
 * Multiple INSERT query.
 * @param  {string} table - Table's name
 * @param  {Array.<Object>} data - Data to insert. @example [{columnName: 'newValueA'}, {columnName: 'newValueB'}]
 * @param  {string[]} protectedColumns - Columns to be ignore for insert statement. @example ['columnA', 'columnB']
 * @param  {string[]} cacheKeys - Redis key to be remove. @example {'keyTableA', 'keyTableB'}
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.insertManyData = ({ table = '', data = {}, protectedColumns = [], cacheKeys = [] }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()']
        let nullChar = ['NULL']

        // if data invalid object
        if (!_.isObjectLike(data) || _.isEmpty(data) || data.length === undefined) {
            return resolve(res)
        }

        // get table columns
        const columns = await this.checkColumn({ table })
        // compare fields from data with columns
        const diff = _.difference(data[0], columns)

        // if there are invalid fields/columns
        if (!_.isEmpty(diff)) {
            return resolve(res)
        }

        // remove invalid data
        requestHelper.filterData(data[0])
        const keys = Object.keys(data[0])

        // if key data empty
        if (_.isEmpty(keys)) {
            return resolve(res)
        }

        // check protected columns on submitted data
        const forbiddenColumns = _.intersection(protectedColumns, keys)

        if (!_.isEmpty(forbiddenColumns)) {
            return resolve(res)
        }

        const column = keys.join(', ')
        let query = `INSERT INTO ${table} (${column}) VALUES ?`
        let values = []
        let tempVal = []

        for (key in data) {
            // if 'key' and 'data order' on each object not the same
            if (!_.isEqual(keys, Object.keys(data[key]))) {
                return resolve(res)
            }

            tempVal = Object.keys(data[key]).map(k => {
                let dataVal = ''

                if (typeof data[key][k] !== undefined) {
                    dataVal = _.trim(data[key][k])

                    if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                        let d = new Date()
                        dataVal = dateFormat(d, 'yyyy-mm-dd HH:MM:ss')
                    }

                    if (_.indexOf(nullChar, _.toUpper(dataVal)) >= 0) {
                        dataVal = null
                    }
                } else {
                    dataVal = null
                }

                return dataVal
            })

            values.push(tempVal)
        }

        dbConn.query(query, [values], (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return resolve(res)
            }

            res = {
                total_data: results.affectedRows,
                data: data
            }

            resolve(res)
        })
    })
}

/**
 * Multiple INSERT query with ON DUPLICATE KEY UPDATE condition
 * @param  {string} table - Table's name
 * @param  {Array.<Object>} data - Data to insert. @example [{columnName: 'newValueA'}, {columnName: 'newValueB'}]
 * @param  {string[]} protectedColumns - Columns to be ignore for insert statement. @example ['columnA', 'columnB']
 * @param  {string[]} cacheKeys - Redis key to be remove. @example {'keyTableA', 'keyTableB'}
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.insertDuplicateUpdateData = ({ table = '', data = {}, protectedColumns = [], cacheKeys = [] }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()']
        let nullChar = ['NULL']

        // if data invalid object
        if (!_.isObjectLike(data) || _.isEmpty(data) || data.length === undefined) {
            return resolve(res)
        }

        // get table columns
        const columns = await this.checkColumn({ table })
        // compare fields from data with columns
        const diff = _.difference(data[0], columns)

        // if there are invalid fields/columns
        if (!_.isEmpty(diff)) {
            return resolve(res)
        }

        // remove invalid data
        requestHelper.filterData(data[0])
        const keys = Object.keys(data[0])

        // if key data empty
        if (_.isEmpty(keys)) {
            return resolve(res)
        }

        // check protected columns on submitted data
        const forbiddenColumns = _.intersection(protectedColumns, keys)

        if (!_.isEmpty(forbiddenColumns)) {
            return resolve(res)
        }

        const column = keys.join(', ')
        let update = []

        keys.forEach(function (value) {
            update.push(`${value} = VALUES(${value})`)
        })

        const updateDuplicate = _.join(update, ', ')

        let query = `INSERT INTO ${table} (${column}) VALUES ? ON DUPLICATE KEY UPDATE ${updateDuplicate}`
        let values = []
        let tempVal = []

        for (key in data) {
            // if 'key' and 'data order' on each object not the same
            if (!_.isEqual(keys, Object.keys(data[key]))) {
                return resolve(res)
            }

            tempVal = Object.keys(data[key]).map(k => {
                let dataVal = ''

                if (typeof data[key][k] !== undefined) {
                    dataVal = _.trim(data[key][k])

                    if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                        let d = new Date()
                        dataVal = dateFormat(d, 'yyyy-mm-dd HH:MM:ss')
                    }

                    if (_.indexOf(nullChar, _.toUpper(dataVal)) >= 0) {
                        dataVal = null
                    }
                } else {
                    dataVal = null
                }

                return dataVal
            })

            values.push(tempVal)
        }

        dbConn.query(query, [values], (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return resolve(res)
            }

            res = {
                total_data: results.affectedRows,
                data: data
            }

            resolve(res)
        })
    })
}

/**
 * UPDATE query
 * @param  {string} table - Table's name
 * @param  {Object.<string, string|number>} data - Data to update. @example {columnName: 'newValue'}
 * @param  {Object.<string, string|number>} conditions - Query conditions
 * @param  {string} attributeColumn - custom attribute column name in selected table
 * @param  {string[]} protectedColumns - Columns to be ignore for update statement. @example ['columnA', 'columnB']
 * @param  {string[]} cacheKeys - Redis key to be remove. @example {'keyTableA', 'keyTableB'}
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.updateData = ({ table = '', data = {}, conditions = {}, attributeColumn = '', protectedColumns = [], cacheKeys = [] }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()']
        let nullChar = ['NULL']
        let setData = []
        let queryData = ''
        let setCond = []
        let queryCond = ''
        let query = `UPDATE ${table}`
        const dataCustom = { ... data }
        const customAttribute = { ... conditions }
        const columns = await this.checkColumn({ table })

        // remove invalid column from data
        requestHelper.filterColumn(data, columns)
        // remove invalid data
        requestHelper.filterData(data)
        
        let customFields = []
        let getCustomFields
        let customDropdownFields

        if (!_.isEmpty(attributeColumn)) {
            getCustomFields = await this.checkCustomField({ table })
            customFields = _.map(getCustomFields, 'field_key')
            const getDropdownColumn = _.filter(getCustomFields, { 'field_type_id': 5 })
            customDropdownFields = _.map(getDropdownColumn, 'field_key')
            requestHelper.filterColumn(dataCustom, customFields)
            requestHelper.filterColumn(customAttribute, customFields)
        }

        if (_.isEmpty(conditions)) {
            // reject('Update query is unsafe without data and condition')
            if (_.isEmpty(data) && _.isEmpty(dataCustom)) {
                return resolve(res)
            }
        }

        if (!_.isEmpty(data)) {
            const keys = Object.keys(data)
            // check protected columns on submitted data
            const forbiddenColumns = _.intersection(protectedColumns, keys)

            if (!_.isEmpty(forbiddenColumns)) {
                return resolve(res)
            }
            
            delete data[attributeColumn]

            for (key in data) {
                let dataVal = _.trim(data[key])
                
                if (typeof data[key] !== undefined) {
                    if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                        let d = new Date()
                        dataVal = dateFormat(d, 'yyyy-mm-dd HH:MM:ss')
                    }

                    if (_.indexOf(nullChar, _.toUpper(dataVal)) >= 0) {
                        dataVal = null
                    }
                } else {
                    dataVal = null
                }

                if (_.isEmpty(dataVal) && dataVal !== 0) {
                    setData.push(`${key} = NULL`)
                } else {
                    setData.push(`${key} = ${dbConn.escape(dataVal)}`)
                }
            }
        }

        if (!_.isEmpty(attributeColumn)) {
            let setJsonData = []
            
            for (key in dataCustom) {
                
                if (customFields.indexOf(key) >= 0) {
                    
                    if (customDropdownFields.indexOf(key) >= 0) {
                        let dropdownData = dataCustom[key].split('||')
                        let dropdownId = dropdownData[0] || ''
                        let dropdownValue = dropdownData[1] || ''

                        if ((!isNaN(dropdownId) || _.isNumber(dropdownId)) && dropdownId > 0 && !_.isEmpty(dropdownValue)) {
                            setJsonData.push(`'$.${key}', JSON_OBJECT('id', ${dbConn.escape(_.parseInt(dropdownId))}, 'value', ${dbConn.escape(dropdownValue)})`)
                        }
                    } else {
                        setJsonData.push(`'$.${key}', ${dbConn.escape(dataCustom[key])}`)
                    }
                }
            }

            let joinData = _.join(setJsonData, ', ')

            if (!_.isEmpty(joinData)) {
                setData.push(`${attributeColumn} = JSON_SET(COALESCE(${attributeColumn}, '{}'), ${joinData})`)
            }
        }

        queryData = _.join(setData, ', ')
        query += ` SET ${queryData}`

        if (!_.isEmpty(conditions)) {
            for (key in conditions) {
                if (_.isArray(conditions[key])) {
                    setCond.push(`${key} IN (${_.trim(conditions[key].join(','))})`)
                } else {
                    setCond.push(`${key} = ${dbConn.escape(_.trim(conditions[key]))}`)
                }
            }
        }

        if (!_.isEmpty(attributeColumn)) {
            // for custom attributes
            for (key in customAttribute) {
                if (customFields.indexOf(key) >= 0) {
                    let queryLine = `JSON_EXTRACT(${attributeColumn}, '$.${key}') = ${dbConn.escape(customAttribute[key])}`
                    setCond.push(queryLine)
                }
            }
        }
        
        queryCond = _.join(setCond, ' AND ')
        query += ` WHERE ${queryCond}`
        
        dbConn.query(query, (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return resolve(res)
            }

            res = {
                total_data: results.affectedRows,
                data: conditions
            }

            if (res.total_data < 1 || results.warningCount) {
                res.data = false
            }

            resolve(res)
        })
    })
}

/**
 * DELETE query
 * @param  {string} table - Table's name
 * @param  {Object.<string, string|number>} conditions - Query conditions
 * @param  {string[]} cacheKeys - Redis key to be remove. @example {'keyTableA', 'keyTableB'}
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.deleteData = ({ table = '', conditions = {}, cacheKeys = [] }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }
        let setCond = []
        let queryCond = ''
        let query = `DELETE FROM ${table}`

        if (_.isEmpty(conditions)) {
            // reject('Delete query is unsafe without condition')
            return resolve(res)
        }

        for (key in conditions) {
            setCond.push(`${key} = ${dbConn.escape(conditions[key])}`)
        }

        queryCond = _.join(setCond, ' AND ')

        query += ` WHERE ${queryCond}`

        dbConn.query(query, (err, results, fields) => {
            if (err) {
                // throw err
                console.error(err)
                return resolve(res)
            }

            res = {
                total_data: results.affectedRows,
                data: conditions
            }

            if (res.total_data == 0) {
                res.data = false
            }

            resolve(res)
        })
    })
}
