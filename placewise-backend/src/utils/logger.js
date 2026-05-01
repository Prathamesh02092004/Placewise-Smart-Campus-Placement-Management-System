const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log line format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `[${timestamp}] ${level}: ${message}\n${stack}`
    : `[${timestamp}] ${level}: ${message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }) // capture stack traces
  ),
  transports: [
    // Console transport (development)
    new transports.Console({
      format: combine(colorize(), logFormat),
      silent: process.env.NODE_ENV === 'test',
    }),

    // Rotating file transport — info and above
    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    }),

    // Separate file for errors only
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    }),
  ],
});

module.exports = logger;