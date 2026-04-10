const pino = require('pino');

const isDevelopment = process.env.NODE_ENV !== 'production';

// Resilient LOG_LEVEL handling to prevent boot failure on invalid strings
const VALID_LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
const envRawLevel = (process.env.LOG_LEVEL || 'info').trim().toLowerCase();
const currentLevel = VALID_LOG_LEVELS.includes(envRawLevel) ? envRawLevel : 'info';

const logger = pino({
  level: currentLevel,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

module.exports = logger;
