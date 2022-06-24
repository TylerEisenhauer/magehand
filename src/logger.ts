import { createLogger, format, transports } from 'winston'

const logger = createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    transports: [
        new transports.Console({
            format: format.simple()
        })
    ]
})

export {
    logger
}
