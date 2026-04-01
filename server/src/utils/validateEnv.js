/**
 * Environment Variables Validator
 * Ensures the server doesn't start without critical configuration.
 */
const logger = require('./logger');

const criticalVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'CLIENT_URL'
];

const optionalVars = [
  'SMTP_HOST',
  'SMTP_EMAIL',
  'SMTP_PASSWORD'
];

const validateEnv = () => {
  const missingCritical = criticalVars.filter(v => !process.env[v]);
  const missingOptional = optionalVars.filter(v => !process.env[v]);

  if (missingCritical.length > 0) {
    logger.error({ missing: missingCritical }, '❌ CRITICAL: Missing Critical Environment Variables');
    
    // In production, we exit to prevent inconsistent state, UNLESS we are on Vercel
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      console.error('\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('!!  SHUTTING DOWN: Missing required variables   !!');
      console.error(`!!  ${missingCritical.join(', ')}`);
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n');
      process.exit(1);
    } else {
      logger.warn(`⚠️ Server starting with missing critical vars: ${missingCritical.join(', ')}`);
    }
  }

  if (missingOptional.length > 0) {
    logger.warn(`⚠️ Optional variables missing (Email/SMTP will not work): ${missingOptional.join(', ')}`);
  }

  if (missingCritical.length === 0 && missingOptional.length === 0) {
    logger.info('✅ Environment variables validated');
  }
};

module.exports = validateEnv;
