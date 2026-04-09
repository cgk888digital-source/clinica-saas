const Sequelize = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const config = configs[env];

// DATABASE_URL takes priority (Supabase, Neon, Railway, Heroku, etc.)
const databaseUrl = process.env.DATABASE_URL;

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        keepAlive: true
      },
      pool: { 
        max: 8, 
        min: 0, 
        acquire: 30000, 
        idle: 10000,
        evict: 1000 // Remove idle connections every second for serverless stability
      }
    })
  : config.url
    ? new Sequelize(config.url, {
        dialect: config.dialect,
        logging: config.logging,
        pool: config.pool,
        dialectOptions: config.dialectOptions
      })
    : new Sequelize(
        config.database,
        config.username,
        config.password,
        {
          host: config.host,
          port: config.port,
          dialect: config.dialect,
          logging: config.logging,
          pool: config.pool,
          dialectOptions: config.dialectOptions
        }
      );

// Force inclusion for Vercel
if (process.env.VERCEL) {
  sequelize.connectionManager.lib = require('pg');
}

module.exports = sequelize;
