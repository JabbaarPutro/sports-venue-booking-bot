const moment = require('moment');

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

class Logger {
    static log(level, message, data = null) {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        
        if (level === LOG_LEVELS.ERROR) {
            console.error(logMessage, data || '');
        } else if (level === LOG_LEVELS.WARN) {
            console.warn(logMessage, data || '');
        } else {
            console.log(logMessage, data || '');
        }
    }

    static error(message, data = null) {
        this.log(LOG_LEVELS.ERROR, message, data);
    }

    static warn(message, data = null) {
        this.log(LOG_LEVELS.WARN, message, data);
    }

    static info(message, data = null) {
        this.log(LOG_LEVELS.INFO, message, data);
    }

    static debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            this.log(LOG_LEVELS.DEBUG, message, data);
        }
    }
}

module.exports = Logger;
