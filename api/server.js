const app = require('../server/src/index');
const cors = require('cors');

// Inyectar configuraciones básicas para entorno serverless
app.use(cors());

module.exports = app;
