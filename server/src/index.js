const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

// Core config
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('dev'));
app.use(compression());

// Boot diagnostics
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    time: new Date().toISOString() 
  });
});

/**
 * 🛠️ EMERGENCY DATABASE INITIALIZER (Standalone)
 */
app.get('/api/system/init-888', async (req, res) => {
  const { key } = req.query;
  if (key !== 'v888') return res.status(403).json({ error: 'Unauthorized Access Key' });

  try {
    const sequelize = require('./config/db.config');
    const seedRoles = require('./utils/seeder');
    const seedTestData = require('./utils/legacy/testSeeder');
    
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    await seedRoles();
    await seedTestData();

    res.status(200).json({ success: true, message: 'Database reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Initialization failed', detail: err.message });
  }
});

app.get('/api/system/init-prod', async (req, res) => {
  const { key } = req.query;
  if (key !== 'v888') return res.status(403).json({ error: 'Unauthorized Access Key' });

  try {
    const sequelize = require('./config/db.config');
    const seedCleanData = require('./utils/cleanSeeder');
    
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    await seedCleanData();

    res.status(200).json({ 
      success: true, 
      message: '✅ Base de datos LIMPIA e INICIALIZADA (Sin datos de prueba).' 
    });
  } catch (err) {
    res.status(500).json({ error: 'Production Initialization failed', detail: err.message });
  }
});

// Lazy Loader to ensure Vercel boots instantly and only loads heavy stuff on demand
let router = null;
let bootError = null;

const getRouter = () => {
  if (bootError) throw bootError;
  if (router) return router;

  try {
    const { Router } = require('express');
    const gameRouter = Router();

    // Load dependencies synchronously now that we are inside the first request
    const { sanitizeInput } = require('./utils/sanitize');
    const authMiddleware = require('./middlewares/auth.middleware');
    const contextMiddleware = require('./middlewares/context.middleware');
    const protected = [authMiddleware, contextMiddleware];

    gameRouter.use(sanitizeInput);

    // Mount Routes
    gameRouter.use('/auth', require('./routes/auth.routes'));
    gameRouter.use('/exchange', require('./routes/exchange.routes'));
    gameRouter.use('/doctors', protected, require('./routes/doctor.routes'));
    gameRouter.use('/patients', protected, require('./routes/patient.routes'));
    gameRouter.use('/appointments', protected, require('./routes/appointment.routes'));
    gameRouter.use('/medical-records', protected, require('./routes/medicalRecord.routes'));
    gameRouter.use('/payments', protected, require('./routes/payment.routes'));
    gameRouter.use('/organizations', protected, require('./routes/organization.routes'));
    gameRouter.use('/specialties', protected, require('./routes/specialty.routes'));
    gameRouter.use('/staff', protected, require('./routes/staff.routes'));
    gameRouter.use('/lab-catalog', protected, require('./routes/labCatalog.routes'));
    gameRouter.use('/lab-results', protected, require('./routes/labResult.routes'));
    gameRouter.use('/drugs', protected, require('./routes/drug.routes'));
    gameRouter.use('/nurses', protected, require('./routes/nurse.routes'));
    gameRouter.use('/video-consultations', protected, require('./routes/videoConsultation.routes'));
    gameRouter.use('/stats', protected, require('./routes/stats.routes'));
    gameRouter.use('/team', protected, require('./routes/team.routes'));
    gameRouter.use('/prescriptions', protected, require('./routes/prescription.routes'));
    gameRouter.use('/bulk', protected, require('./routes/bulk.routes'));
    gameRouter.use('/public', require('./routes/public.routes'));
    gameRouter.use('/admin', require('./routes/admin.routes'));

    router = gameRouter;
    return router;
  } catch (err) {
    bootError = err;
    console.error('❌ BOOT FAILURE:', err);
    throw err;
  }
};

// Dispatch all /api requests (except health/init) to the lazy-loaded router
app.use('/api', (req, res, next) => {
  try {
    const r = getRouter();
    r(req, res, next);
  } catch (err) {
    res.status(500).json({ 
      error: 'Backend Boot Failure', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Final Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor'
  });
});

module.exports = app;
