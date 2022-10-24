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
 * Return total data
 * @param  {string} table - Table's name
 * @param  {Object} conditions - Query conditions. @example {columnName: 'columnValue'}
 * @param  {Object} conditionTypes={ 'like': [], 'date': [] } - Condition option for certain table field. 'like' field will be treated with 'LIKE' condition. 'date' field will be treated with 'DATE()' function inside query condition
 * @param  {Array} customConditions - custom query condition. @example ['tableA.columnTableA = "someValue"']
 * @param  {Array} join - JOIN query statement. @example ['JOIN tableB ON tableB.id = tableA.table_b_id']
 * @param  {Array} groupBy - GROUP BY query statement. @example ['columnA', 'columnB']
 * @param  {Array} having - HAVING query statement. groupBy param required. @example ]'COUNT(columA) > 1']
 * @returns {Promise.<number|Object.<string, number|boolean>>} total data of given table and condition
 */
exports.countData = ({ table = '', conditions = {}, conditionTypes = { 'like': [], 'date': [] }, customConditions = [], join = {}, groupBy = {}, having = {} }) => {
    return new Promise((resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }

        let query = `SELECT COUNT(*) AS count FROM ${table}`

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery = _.join(join, ' ')
            query += ` ${joinQuery}`
        }

        if (!_.isEmpty(conditions) && _.isPlainObject(conditions)) {
            let clause = []

            for (let key in conditions) {
                let val = conditions[key]
                let conditionKey = (!_.isEmpty(join) && _.isArrayLikeObject(join)) ? `${table}.${key}` : key

                if (!_.isEmpty(conditionTypes) && _.isPlainObject(conditionTypes)) {
                    if (_.indexOf(conditionTypes.date, key) >= 0) {
                        val = (_.toNumber(val) > 0) ? moment(val * 1000) : moment(new Date())
                        clause.push(`DATE(${conditionKey}) = ${dbConn.escape(val.format('YYYY-MM-DD'))}`)
                    } else if (_.indexOf(conditionTypes.like, key) >= 0) {
                        val = `%${val}%`
                        clause.push(`${conditionKey} LIKE ${dbConn.escape(val)}`)
                    } else {
                        if (val.constructor === Array) {
                            clause.push(`${conditionKey} IN (${dbConn.escape(val)})`)
                        } else {
                            clause.push(`${conditionKey} = ${dbConn.escape(val)}`)
                        }
                    }
                } else {
                    if (val.constructor === Array) {
                        clause.push(`${conditionKey} IN (${dbConn.escape(val)})`)
                    } else {
                        clause.push(`${conditionKey} = ${dbConn.escape(val)}`)
                    }
                }
            }

            let conditionQuery = _.join(clause, ' AND ')
            query += ` WHERE ${conditionQuery}`
        }

        if (!_.isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            let conditionQuery = _.join(customConditions, ' AND ')

            query += (!_.isEmpty(conditions) && _.isPlainObject(conditions)) ? ' AND ' : ' WHERE '
            query += conditionQuery
        }

        if (!_.isEmpty(groupBy) && _.isArrayLikeObject(groupBy)) {
            let prefixGroup = groupBy.map((grp) => {
                return (_.indexOf(grp, '.') >= 0) ? grp : `${table}.${grp}`
            })

            let columnGroup = _.join(prefixGroup, ', ')
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
 * @param  {String} table - Table's name
 * @param  {Object} conditions - Query conditions. @example {columnName: 'columnValue'}
 * @param  {Object} conditionTypes={ 'like': [], 'date': [] }  - Condition option for certain table field. 'like' field will be treated with 'LIKE' condition. 'date' field will be treated with 'DATE()' function inside query condition
 * @param  {Array} customConditions - custom query condition. @example ['tableA.columnTableA = "someValue"']
 * @param  {Array} columnSelect - custom column to select. @example ['columnA', 'columnB']
 * @param  {Array} columnDeselect - custom column to deselect. @example ['columnA', 'columnB']
 * @param  {Array} customColumns - custom column from join table. @example ['tableB.columnTableB AS newUniqueColumn']
 * @param  {Array} join - JOIN query statement. @example ['JOIN tableB ON tableB.id = tableA.table_b_id']
 * @param  {Array} groupBy - GROUP BY query statement. @example ['columnA', 'columnB']
 * @param  {Array} having - HAVING query statement. groupBy param required. @example ['COUNT(columA) > 1']
 * @param  {Array} customOrders - custom ORDER BY query statement. @example ['CASE tableA.ticket_status_id WHEN 1 THEN tableA.columnA ELSE tableA.columnB END ASC, tableA.columnA']
 * @returns {Promise.<Object.<string, string|number|boolean|Object>>} - data result
 */
exports.getAll = ({ table = '', conditions = {}, conditionTypes = { 'like': [], 'date': [] }, customConditions = [], columnSelect = [], columnDeselect = [], customColumns = [], join = [], groupBy = [], having = [], customOrders = [] }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }

        if (_.isEmpty(table)) {
            return resolve(res)
        }

        const allowedSort = ['ASC', 'DESC']
        const masterColumns = await this.checkColumn({ table })

        let query = ''
        let columns = masterColumns
        let order = (!_.isEmpty(conditions.order)) ? conditions.order : columns[0]
        let sort = (_.indexOf(allowedSort, _.toUpper(conditions.sort)) >= 0) ? _.toUpper(conditions.sort) : allowedSort[0]
        let page = (!_.isNaN(conditions.page) && conditions.page > 0) ? conditions.page : 1
        let limit = (!_.isNaN(conditions.limit) && conditions.limit > 0) ? conditions.limit : 20

        if (!_.isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            columns = _.intersection(columnSelect, columns)
        }

        if (!_.isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            // filter data, get column to exclude from valid selected columns or table columns
            let deselectedColumn = _.intersection(columnDeselect, columns)
            // filter data, exclude deselected columns
            columns = _.difference(columns, deselectedColumn)
        }

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            let prefixColumn = columns.map(function (col) {
                return `${table}.${col}`
            })

            columns = prefixColumn
        }

        if (!_.isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            // filter data, exclude customColumn if aleady exist in columns
            columns = _.union(columns, customColumns)
        }

        let columnQuery = _.join(columns, ', ')

        if (table) {
            query = `SELECT ${columnQuery} FROM ${table}`
        }

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery = _.join(join, ' ')
            query += ` ${joinQuery}`
        }

        // remove invalid column from conditions
        requestHelper.filterColumn(conditions, masterColumns)

        if (!_.isEmpty(conditions) && _.isPlainObject(conditions)) {
            let clause = []

            for (let key in conditions) {
                let val = conditions[key]
                let conditionKey = (!_.isEmpty(join) && _.isArrayLikeObject(join)) ? `${table}.${key}` : key

                if (!_.isEmpty(conditionTypes) && _.isPlainObject(conditionTypes)) {
                    if (_.indexOf(conditionTypes.date, key) >= 0) {
                        val = (_.toNumber(val) > 0) ? moment(val * 1000) : moment(new Date())
                        clause.push(`DATE(${conditionKey}) = ${dbConn.escape(val.format('YYYY-MM-DD'))}`)
                    } else if (_.indexOf(conditionTypes.like, key) >= 0) {
                        val = `%${val}%`
                        clause.push(`${conditionKey} LIKE ${dbConn.escape(val)}`)
                    } else {
                        if (val.constructor === Array) {
                            clause.push(`${conditionKey} IN (${dbConn.escape(val)})`)
                        } else {
                            clause.push(`${conditionKey} = ${dbConn.escape(val)}`)
                        }
                    }
                } else {
                    if (val.constructor === Array) {
                        clause.push(`${conditionKey} IN (${dbConn.escape(val)})`)
                    } else {
                        clause.push(`${conditionKey} = ${dbConn.escape(val)}`)
                    }
                }
            }

            let conditionQuery = _.join(clause, ' AND ')
            query += ` WHERE ${conditionQuery}`
        }

        if (!_.isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            let conditionQuery = _.join(customConditions, ' AND ')

            query += (!_.isEmpty(conditions) && _.isPlainObject(conditions)) ? ' AND ' : ' WHERE '
            query += conditionQuery
        }

        if (!_.isEmpty(groupBy) && _.isArrayLikeObject(groupBy)) {
            let prefixGroup = groupBy.map((grp) => {
                return (_.indexOf(grp, '.') >= 0) ? grp : `${table}.${grp}`
            })

            let columnGroup = _.join(prefixGroup, ', ')
            query += ` GROUP BY ${columnGroup}`

            if (!_.isEmpty(having) && _.isArrayLikeObject(having)) {
                let havingClause = _.join(having, ' AND ')
                query += ` HAVING ${havingClause}`
            }
        }

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            order = `${table}.${order}`
        }

        if (_.indexOf(columns, order) >= 0) {
            query += ` ORDER BY ${order} ${sort}`
        }

        query += ` LIMIT ${limit}`
        let offset = (limit * page) - limit

        if (_.isInteger(offset) && offset >= 0) {
            query += ` OFFSET ${offset}`
        }

        let countData = await this.countData({ table, conditions, conditionTypes, customConditions, join, groupBy, having })

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
 * @param  {String} table - Table's name
 * @param  {Object} conditions - Query conditions. @example {columnName: 'columnValue'}
 * @param  {Array} customConditions - custom query condition. @example ['tableA.columnTableA = "someValue"']
 * @param  {Array} columnSelect - custom column to select. @example ['columnA', 'columnB']
 * @param  {Array} columnDeselect - custom column to deselect. @example ['columnA', 'columnB']
 * @param  {Array} customColumns - custom column from join table. @example ['tableB.columnTableB AS newUniqueColumn']
 * @param  {Array} join - JOIN query statement. @example ['JOIN tableB ON tableB.id = tableA.table_b_id']
 * @returns {Promise.<Object.<string, string|number|boolean|Object>>} - data result
 */
exports.getDetail = ({ table = '', conditions = {}, customConditions = [], columnSelect = [], columnDeselect = [], customColumns = [], join = [] }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }

        if (_.isEmpty(table)) {
            return resolve(res)
        }

        const masterColumns = await this.checkColumn({ table })

        let query = 'SELECT'
        let columns = masterColumns

        if (!_.isEmpty(columnSelect) && _.isArrayLikeObject(columnSelect)) {
            // filter data from all table columns, only keep selected columns
            columns = _.intersection(columnSelect, columns)
        }

        if (!_.isEmpty(columnDeselect) && _.isArrayLikeObject(columnDeselect)) {
            // filter data, get column to exclude from valid selected columns or table columns
            let deselectedColumn = _.intersection(columnDeselect, columns)
            // filter data, exclude deselected columns
            columns = _.difference(columns, deselectedColumn)
        }

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            let prefixColumn = columns.map(function (col) {
                return `${table}.${col}`
            })

            columns = prefixColumn
        }

        if (!_.isEmpty(customColumns) && _.isArrayLikeObject(customColumns)) {
            // push value data if doesn't exist in columns
            columns = _.union(columns, customColumns)
        }

        let columnQuery = _.join(columns, ', ')
        query += ` ${columnQuery}`

        if (table) {
            query += ` FROM ${table}`
        } 

        if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
            let joinQuery = _.join(join, ' ')
            query += ` ${joinQuery}`
        }

        // remove invalid column from conditions
        requestHelper.filterColumn(conditions, masterColumns)

        if (!_.isEmpty(conditions) && _.isPlainObject(conditions)) {
            let clause = []

            for (let key in conditions) {
                let keyCondition = key

                if (!_.isEmpty(join) && _.isArrayLikeObject(join)) {
                    keyCondition = `${table}.${key}`
                }

                clause.push(`${keyCondition} = ${dbConn.escape(conditions[key])}`)
            }

            let conditionQuery = _.join(clause, ' AND ')
            query += ` WHERE ${conditionQuery}`
        }

        if (!_.isEmpty(customConditions) && _.isArrayLikeObject(customConditions)) {
            let conditionQuery = _.join(customConditions, ' AND ')

            query += (!_.isEmpty(conditions) && _.isPlainObject(conditions)) ? ' AND' : ' WHERE'
            query += ` ${conditionQuery}`
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
 * @param  {Array} protectedColumns - Columns to be ignore for insert statement. @example ['columnA', 'columnB']
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.insertData = ({ table = '', data = {}, attributeColumn = '', protectedColumns = [] }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }

        if (_.isEmpty(table)) {
            return resolve(res)
        }

        const columns = await this.checkColumn({ table })

        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()']
        let nullChar = ['NULL', '']

        // remove invalid column from data
        requestHelper.filterColumn(data, columns)

        // remove invalid data
        requestHelper.filterData(data)

        if (_.isEmpty(data) || !_.isPlainObject(data)) {
            return resolve(res)
        }

        let keys = Object.keys(data)

        // check protected columns on submitted data
        let forbiddenColumns = _.intersection(protectedColumns, keys)

        if (!_.isEmpty(forbiddenColumns)) {
            return resolve(res)
        }

        let column = _.join(keys, ', ')
        let query = `INSERT INTO ${table} (${column}) VALUES ?`
        let values = []

        let tempVal = Object.keys(data).map(key => {
            let val = data[key]

            if (typeof val !== undefined) {
                val = _.trim(val)

                if (_.indexOf(timeChar, _.toUpper(val)) >= 0) {
                    val = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                }

                if (_.indexOf(nullChar, _.toUpper(val)) >= 0) {
                    val = null
                }
            } else {
                val = null
            }

            return val
        })

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
 * @param  {Array} protectedColumns - Columns to be ignore for insert statement. @example ['columnA', 'columnB']
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.insertManyData = ({ table = '', data = {}, protectedColumns = [] }) => {
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

        for (let key in data) {
            // if 'key' and 'data order' on each object not the same
            if (!_.isEqual(keys, Object.keys(data[key]))) {
                return resolve(res)
            }

            tempVal = Object.keys(data[key]).map(k => {
                let dataVal = ''

                if (typeof data[key][k] !== undefined) {
                    dataVal = _.trim(data[key][k])

                    if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                        dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
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
 * @param  {Array} protectedColumns - Columns to be ignore for insert statement. @example ['columnA', 'columnB']
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.insertDuplicateUpdateData = ({ table = '', data = {}, protectedColumns = [] }) => {
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

        for (let key in data) {
            // if 'key' and 'data order' on each object not the same
            if (!_.isEqual(keys, Object.keys(data[key]))) {
                return resolve(res)
            }

            tempVal = Object.keys(data[key]).map(k => {
                let dataVal = ''

                if (typeof data[key][k] !== undefined) {
                    dataVal = _.trim(data[key][k])

                    if (_.indexOf(timeChar, _.toUpper(dataVal)) >= 0) {
                        dataVal = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
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
 * @param  {Object} data - Data to update. @example {columnName: 'newValue'}
 * @param  {Array} protectedColumns - Columns to be ignore for update statement. @example ['columnA', 'columnB']
 * @param  {Object} conditions - Query conditions
 * @param  {Array} cacheKeys - Redis key to be remove. @example ['keyTableA', 'keyTableB']
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.updateData = ({ table = '', data = {}, protectedColumns = [], conditions = {} }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }

        if (_.isEmpty(table)) {
            return resolve(res)
        }

        const columns = await this.checkColumn({ table })

        // remove invalid column from data
        requestHelper.filterColumn(data, columns)
        // remove invalid data
        requestHelper.filterData(data)
        // remove invalid column from conditions
        requestHelper.filterColumn(conditions, columns)

        if (_.isEmpty(data) || !_.isPlainObject(data) || _.isEmpty(conditions) || !_.isPlainObject(conditions)) {
            return resolve(res)
        }

        let query = `UPDATE ${table}`
        let queryData = []
        let queryCondition = []
        let timeChar = ['CURRENT_TIMESTAMP()', 'NOW()']
        let nullChar = ['NULL']

        const keys = Object.keys(data)
        const forbiddenColumns = _.intersection(protectedColumns, keys)

        if (!_.isEmpty(forbiddenColumns)) {
            return resolve(res)
        }

        for (let key in data) {
            let val = _.trim(data[key])

            if (typeof val !== undefined) {
                if (_.indexOf(timeChar, _.toUpper(val)) >= 0) {
                    val = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                }

                if (_.indexOf(nullChar, _.toUpper(val)) >= 0) {
                    val = null
                }
            } else {
                dataVal = null
            }

            if (_.isEmpty(val) && val !== 0) {
                queryData.push(`${key} = NULL`)
            } else {
                queryData.push(`${key} = ${dbConn.escape(val)}`)
            }
        }

        queryData = _.join(queryData, ', ')
        query += ` SET ${queryData}`

        for (let key in conditions) {
            let val = conditions[key]

            if (_.isArray(val)) {
                queryCondition.push(`${key} IN (${_.trim(val.join(','))})`)
            } else {
                queryCondition.push(`${key} = ${dbConn.escape(_.trim(val))}`)
            }
        }

        queryCondition = _.join(queryCondition, ' AND ')
        query += ` WHERE ${queryCondition}`
        
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
 * @param  {Object} conditions - Query conditions
 * @returns {Promise.<Object.<string, number|boolean|Object>>} - data result
 */
exports.deleteData = ({ table = '', conditions = {} }) => {
    return new Promise(async (resolve, reject) => {
        let res = {
            total_data: 0,
            data: false
        }

        if (_.isEmpty(table)) {
            return resolve(res)
        }

        const columns = await this.checkColumn({ table })

        // remove invalid column from conditions
        requestHelper.filterColumn(conditions, columns)

        if (_.isEmpty(conditions) || !_.isPlainObject(conditions)) {
            return resolve(res)
        }

        let query = `DELETE FROM ${table}`
        let queryCondition = []

        for (let key in conditions) {
            let val = conditions[key]
            queryCondition.push(`${key} = ${dbConn.escape(val)}`)
        }

        queryCondition = _.join(queryCondition, ' AND ')
        query += ` WHERE ${queryCondition}`

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
