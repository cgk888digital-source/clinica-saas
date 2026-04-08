const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Core Middlewares
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:*"],
      connectSrc: ["'self'", "https:*", "wss:*"]
    }
  }
}));

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('dev'));
app.use(compression());

// Limiters
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

app.use('/api/', globalLimiter);

/**
 * 🛠️ EMERGENCY DATABASE INITIALIZER
 */
app.get('/api/system/init-888', async (req, res) => {
  const { key } = req.query;
  if (key !== 'v888') return res.status(403).json({ error: 'Unauthorized Access Key' });

  try {
    const sequelize = require('./config/db.config');
    const seedRoles = require('./utils/seeder');
    const seedTestData = require('./utils/legacy/testSeeder');
    
    console.log('🔄 Sincronizando esquema de base de datos (force: true)...');
    await sequelize.sync({ force: true });
    
    console.log('🔄 Ejecutando seeders básicos (Roles + Usuarios)...');
    await seedRoles();
    await seedTestData();

    res.status(200).json({ 
      success: true, 
      message: '✅ Base de datos inicializada correctamente.',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err);
    res.status(500).json({ error: 'Initialization Failure', detail: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Load routes and logic
const sequelize = require('./config/db.config');
const { sanitizeInput } = require('./utils/sanitize');
const authMiddleware = require('./middlewares/auth.middleware');
const contextMiddleware = require('./middlewares/context.middleware');

app.use(sanitizeInput);

const protected = [authMiddleware, contextMiddleware];

// Route definitions - Standard Express setup
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/exchange', require('./routes/exchange.routes'));
app.use('/api/doctors', protected, require('./routes/doctor.routes'));
app.use('/api/patients', protected, require('./routes/patient.routes'));
app.use('/api/appointments', protected, require('./routes/appointment.routes'));
app.use('/api/medical-records', protected, require('./routes/medicalRecord.routes'));
app.use('/api/payments', protected, require('./routes/payment.routes'));
app.use('/api/organizations', protected, require('./routes/organization.routes'));
app.use('/api/specialties', protected, require('./routes/specialty.routes'));
app.use('/api/staff', protected, require('./routes/staff.routes'));
app.use('/api/lab-catalog', protected, require('./routes/labCatalog.routes'));
app.use('/api/lab-results', protected, require('./routes/labResult.routes'));
app.use('/api/drugs', protected, require('./routes/drug.routes'));
app.use('/api/nurses', protected, require('./routes/nurse.routes'));
app.use('/api/video-consultations', protected, require('./routes/videoConsultation.routes'));
app.use('/api/stats', protected, require('./routes/stats.routes'));
app.use('/api/team', protected, require('./routes/team.routes'));
app.use('/api/prescriptions', protected, require('./routes/prescription.routes'));
app.use('/api/bulk', protected, require('./routes/bulk.routes'));
app.use('/api/public', require('./routes/public.routes'));

// Final Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Local Start
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
