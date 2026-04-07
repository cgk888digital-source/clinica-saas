const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);
app.use(cors(corsOptions));

// Ensure these are picked up by Vercel's NFT
try {
  require('pg');
  require('pg-hstore');
} catch (e) {
  console.warn('⚠️ [Vercel] Pre-loading pg failed at root level.');
}

/**
 * 🛡️ ULTRA-ISOLATED BOOT (Emergency Mode)
 * This is the ONLY thing that runs immediately at top-level.
 * If this fails, then Vercel's environment is broken.
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    isolated: true,
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/debug-files', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  function listFiles(dir, depth = 0) {
    if (depth > 3) return [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let result = [];
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          result.push({ name: entry.name, type: 'dir', children: listFiles(fullPath, depth + 1) });
        } else {
          result.push({ name: entry.name, type: 'file' });
        }
      }
      return result;
    } catch (e) {
      return [{ error: e.message }];
    }
  }

  const root = path.resolve('.');
  res.json({
    root,
    files: listFiles(root)
  });
});

/**
 * 🛠️ EMERGENCY DATABASE INITIALIZER
 * Access: /api/system/init-888?key=v888
 * This creates tables and seeds mandatory roles.
 */
app.get('/api/system/init-888', async (req, res) => {
  const { key } = req.query;
  if (key !== 'v888') return res.status(403).json({ error: 'Unauthorized Access Key' });

  try {
    const sequelize = require('./config/db.config');
    const seedRoles = require('./utils/seeder');
    
    console.log('🔄 Sincronizando esquema de base de datos (alter: true)...');
    await sequelize.sync({ alter: true });
    
    console.log('🔄 Ejecutando seeders básicos (Roles)...');
    await seedRoles();

    res.status(200).json({ 
      success: true, 
      message: '✅ Base de datos inicializada y esquema sincronizado correctamente.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err);
    res.status(500).json({ 
      error: 'Hubo un fallo al inicializar la base de datos.',
      detail: err.message
    });
  }
});

// --- NO OTHER TOP-LEVEL REQUIRES EXCEPT MINIMAL BOOTSTRAP ---

let isAppLoaded = false;
let bootError = null;

/**
 * Lazy Application Loader
 * This drags in the rest of the universe (sequelize, models, routes) 
 * ONLY when an actual API request comes in.
 */
const loadApp = async (req, res, next) => {
  if (req.path === '/api/health' || req.path === '/api/debug-files') return next();

  if (isAppLoaded) return next();
  if (bootError) return res.status(500).json({ error: 'Critical Boot Failure', detail: bootError.message });

  try {
    console.log('🚀 [Vercel] Lazy-loading full application context...');
    
    // Dependencies
    const morgan = require('morgan');
    const helmet = require('helmet');
    const compression = require('compression');
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./config/swagger.config');
    const sequelize = require('./config/db.config');
    const logger = require('./utils/logger');
    const { sanitizeInput } = require('./utils/sanitize');
    const authMiddleware = require('./middlewares/auth.middleware');

    // App Middleware Configuration
    app.use(helmet({ 
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false // Disable CSP in dev to avoid blocking calls
    }));
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    app.use(morgan('dev'));
    app.use(compression());
    app.use(sanitizeInput);

    // Database check
    await sequelize.authenticate();

    // Routes (Loaded on demand inside this function)
    const routes = {
      auth: require('./routes/auth.routes'),
      exchange: require('./routes/exchange.routes'),
      doctors: require('./routes/doctor.routes'),
      patients: require('./routes/patient.routes'),
      appointments: require('./routes/appointment.routes'),
      medicalRecords: require('./routes/medicalRecord.routes'),
      payments: require('./routes/payment.routes'),
      organizations: require('./routes/organization.routes'),
      specialties: require('./routes/specialty.routes'),
      staff: require('./routes/staff.routes'),
      labCatalog: require('./routes/labCatalog.routes'),
      labResults: require('./routes/labResult.routes'),
      drugs: require('./routes/drug.routes'),
      nurses: require('./routes/nurse.routes'),
      video: require('./routes/videoConsultation.routes'),
      stats: require('./routes/stats.routes'),
      team: require('./routes/team.routes'),
      prescriptions: require('./routes/prescription.routes'),
      bulk: require('./routes/bulk.routes'),
      public: require('./routes/public.routes'),
    };

    // Mount Routes
    app.use('/api/auth', authLimiter, routes.auth);
    app.use('/api/exchange', routes.exchange);
    app.use('/api/doctors', authMiddleware, routes.doctors);
    app.use('/api/patients', authMiddleware, routes.patients);
    app.use('/api/appointments', authMiddleware, routes.appointments);
    app.use('/api/medical-records', authMiddleware, routes.medicalRecords);
    app.use('/api/payments', authMiddleware, routes.payments);
    app.use('/api/organizations', authMiddleware, routes.organizations);
    app.use('/api/specialties', authMiddleware, routes.specialties);
    app.use('/api/staff', authMiddleware, routes.staff);
    app.use('/api/lab-catalog', authMiddleware, routes.labCatalog);
    app.use('/api/lab-results', authMiddleware, routes.labResults);
    app.use('/api/drugs', authMiddleware, routes.drugs);
    app.use('/api/nurses', authMiddleware, routes.nurses);
    app.use('/api/video-consultations', authMiddleware, routes.video);
    app.use('/api/stats', authMiddleware, routes.stats);
    app.use('/api/team', authMiddleware, routes.team);
    app.use('/api/prescriptions', authMiddleware, routes.prescriptions);
    app.use('/api/bulk', authMiddleware, routes.bulk);
    app.use('/api/public', routes.public);

    // Swagger Documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ message: 'Ruta no encontrada (Lazy Mode)' });
    });

    isAppLoaded = true;
    console.log('✅ [Vercel] Full context loaded successfully.');
    next();
  } catch (err) {
    bootError = err;
    console.error('❌ [Vercel] FATAL BOOT ERROR:', err);
    res.status(500).json({ error: 'Fatal Boot Error', detail: err.message });
  }
};

// Apply Lazy loader to everything EXCEPT canary
app.use(loadApp);

// Final Error Handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

/**
 * Local Server Boot (Only for development)
 */
if (!process.env.VERCEL) {
  const http = require('http');
  const { initializeSocket } = require('./sockets/videoSocket');
  const server = http.createServer(app);
  
  // Initialize Socket.io for Video Consultations
  initializeSocket(server);

  server.listen(process.env.PORT || 5001, () => {
    console.log(`Server running on port ${process.env.PORT || 5001} (Dev)`);
    console.log('🎥 Socket.io initialized for real-time video signaling');
  });
}

module.exports = app;
