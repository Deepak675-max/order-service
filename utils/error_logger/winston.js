const winston = require('winston');
const { format, transports } = winston;
const { combine, timestamp, json, prettyPrint, printf, colorize, } = format;
const DailyRotateFile = require('winston-daily-rotate-file');

const errorFilter = format((info) => {
    return info.level === 'error' ? info : false;
});

const infoFilter = format((info) => {
    return info.level === 'info' ? info : false;
});

// Custom format function to include the path and errorStatus information
const addPathAndErrorStatus = format((info, opts) => {
    if (info.path) {
        info.path = info.path.replace(process.cwd(), ''); // Remove the current working directory from the path
    }
    if (info.status) {
        info.status = info.status.toString(); // Ensure errorStatus is a string
    }
    return info;
});

const logger = winston.createLogger({
    level: 'debug',
    format: combine(
        addPathAndErrorStatus(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss', tz: 'Asia/Kolkata' }), // Specify Indian timezone
        json(),
        prettyPrint(),
    ),
    transports: [
        new DailyRotateFile({
            level: 'info',
            dirname: 'logs',
            filename: 'app-info-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '1d',
            format: combine(infoFilter(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss', tz: 'Asia/Kolkata' }), addPathAndErrorStatus(), json(), prettyPrint())
        }),
        new DailyRotateFile({
            level: 'error',
            dirname: 'logs',
            filename: 'app-error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '1d',
            format: combine(errorFilter(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss', tz: 'Asia/Kolkata' }), addPathAndErrorStatus(), json(), prettyPrint())
        }),
    ],
});

module.exports = {
    logger
};
