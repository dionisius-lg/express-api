const morgan = require('morgan')
const rfs = require("rotating-file-stream")
const path = require('path')
const moment = require('moment-timezone')
const config = require('./../config')

moment.tz.setDefault(config.timezone)

exports.setRequest = (app) => {
    const logFilename = (time, index) => {
        let logDate = moment(new Date()).format('YYYY-MM-DD')

        if (time) {
            logDate = moment(time).format('YYYY-MM-DD')
        }

        return [logDate, 'access.log'].join('-');
    }

    const accessLogStream = rfs.createStream(logFilename, {
        interval: "1d", // rotate daily 
        path: path.resolve(__dirname, '..', 'log/access')
    })

    // setup the logger 
    morgan.token('body', req => {
        return JSON.stringify(req.body)
    })

    morgan.token('date', function () {
        var p = new Date().toString().replace(/[A-Z]{3}\+/, '+').split(/ /);
        return (p[2] + '/' + p[1] + '/' + p[3] + ':' + p[4] + ' ' + p[5]);
    });

    morgan.token('secret', function (req, res) { return req.headers['Authorization'] })

    app.use(morgan(':remote-addr :remote-user [:date] :status [secret=:secret] ":method :url HTTP/:http-version" :body :response-time ms - :res[content-length] ', { stream: accessLogStream }))
}