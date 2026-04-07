const app = require('./src/index');
const cors = require('cors');

// Inyectar configuraciones básicas para entorno serverless
app.use(cors());

// Simplest possible route for initializing database
app.get('/api/system/init-888', async (req, res) => {
    try {
        const { migrate888 } = require('./src/scripts/init-888');
        if (req.query.key !== 'v888') {
             return res.status(403).json({ error: 'Llave de seguridad v888 inválida.' });
        }
        await migrate888();
        res.json({ message: 'Base de Datos MedicalCare 888 inicializada con éxito.' });
    } catch (error) {
        console.error('Error en init-888:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
