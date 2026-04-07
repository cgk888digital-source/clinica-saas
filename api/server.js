const app = require('./src/index');
const cors = require('cors');

// Inyectar configuraciones básicas para entorno serverless
app.use(cors());

// CATCH-ALL para peticiones de API
// Esto asegura que /api/system/init-888 funcione sin importar cómo Vercel rutee internamente
app.all('/api/system/init-888', async (req, res) => {
    try {
        const { migrate888 } = require('./src/scripts/init-888');
        await migrate888();
        res.json({ success: true, message: 'MedicalCare 888 Core Initialized.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = app;
