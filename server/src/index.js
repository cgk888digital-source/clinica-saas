const express = require('express');
const app = express();

/**
 * 🐦 CANARY HEALTH ROUTE
 * This route must stay at the VERY TOP to isolate crashes.
 * Check this at: https://project-0nl81.vercel.app/api/health
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

// --- ALL OTHER IMPORTS AND LOGIC MUST START AFTER THIS LINE ---

const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
// const rateLimit = require('express-rate-limit'); // Disabled for Vercel production
require('dotenv').config();
const sequelize = require('./config/db.config');
const models = require('./models');
// const seedRoles = require('./utils/seeder');
// const seedTestData = require('./utils/testSeeder');
const { initializeSocket } = require('./sockets/videoSocket');
const logger = require('./utils/logger');
// const swaggerJsdoc = require('swagger-jsdoc'); // Disabled for Vercel production
// const swaggerUi = require('swagger-ui-express'); // Disabled for Vercel production
const { sanitizeInput } = require('./utils/sanitize');
const checkSubscription = require('./middlewares/subscription.middleware');
const authMiddleware = require('./middlewares/auth.middleware');
const validateEnv = require('./utils/validateEnv');
const { initializeDatabase } = require('./utils/migrationManager');

const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Global initialization state
let isInitialized = false;
let lastInitError = null;

/**
 * Lazy initialization for Vercel Serverless
 */
const connectDB = async () => {
    if (isInitialized) return;
    try {
        validateEnv();
        await sequelize.authenticate();
        
        // Skip roles seeding and heavy initialization on Vercel to optimize cold starts
        if (!process.env.VERCEL) {
            // await initializeDatabase();
            // await seedRoles();
            // initializeSocket(server); // Disabled for Vercel production
        }
        
        isInitialized = true;
        logger.info('🚀 Vercel Cold Start: Initialization successful');
    } catch (err) {
        lastInitError = err;
        logger.fatal({ err }, 'Lazy initialization failed');
    }
};

// 1. CORS - Simplified for Production Diagnosis
const corsOptions = {
  origin: true, // Allow all for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 3. Parser & Sanitization
app.use(express.json({ limit: '50kb' })); 
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(morgan('dev'));
app.use(compression());
app.use(sanitizeInput);

// 4. Routes Lazy-Initialization Middleware
app.use(async (req, res, next) => {
    // Skip lazy-init for the canary health route
    if (req.path === '/api/health' || req.path === '/health') return next();

    if (process.env.VERCEL && !isInitialized) {
        await connectDB();
    }
    next();
});

// Import routes AFTER definitions to minimize boot weight
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const medicalRecordRoutes = require('./routes/medicalRecord.routes');
const paymentRoutes = require('./routes/payment.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const organizationRoutes = require('./routes/organization.routes');
const specialtyRoutes = require('./routes/specialty.routes');
const departmentRoutes = require('./routes/department.routes');
const staffRoutes = require('./routes/staff.routes');
const labRoutes = require('./routes/lab.routes');
const exchangeRoutes = require('./routes/exchange.routes');
const drugRoutes = require('./routes/drug.routes');
const nurseRoutes = require('./routes/nurse.routes');
const videoRoutes = require('./routes/video.routes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', authMiddleware, doctorRoutes);
app.use('/api/patients', authMiddleware, patientRoutes);
app.use('/api/appointments', authMiddleware, appointmentRoutes);
app.use('/api/medical-records', authMiddleware, medicalRecordRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/organizations', authMiddleware, organizationRoutes);
app.use('/api/specialties', authMiddleware, specialtyRoutes);
app.use('/api/departments', authMiddleware, departmentRoutes);
app.use('/api/staff', authMiddleware, staffRoutes);
app.use('/api/labs', authMiddleware, labRoutes);
app.use('/api/exchange', exchangeRoutes); 
app.use('/api/drugs', authMiddleware, drugRoutes);
app.use('/api/nurses', authMiddleware, nurseRoutes);
app.use('/api/video', authMiddleware, videoRoutes);

// Error Diagnostic Middleware
app.use((req, res, next) => {
    if (lastInitError) {
        return res.status(500).json({
            error: 'Database Connection Error during bootstrap',
            details: lastInitError.message,
            stack: process.env.NODE_ENV === 'development' ? lastInitError.stack : undefined,
            diagnosis: 'Check Supabase Connection Strings and IP Whitelisting'
        });
    }
    next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Final Error Handler
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;
