const sequelize = require('../src/config/db.config');
require('../src/models');
const seedRoles = require('../src/seeders/seeder');

async function initializeSupabase() {
  console.log('🔄 Conectando con Supabase...');
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida con éxito.');

    console.log('🔄 Sincronizando tablas (alter: true)...');
    await sequelize.sync({ alter: true });
    console.log('✅ Tablas sincronizadas correctamente.');

    console.log('🔄 Ejecutando seeders de Roles...');
    await seedRoles();
    console.log('✅ Roles inyectados correctamente.');

    console.log('\n🚀 ¡Supabase está LISTO para MedicalCare 888 v2.3.0!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
    process.exit(1);
  }
}

initializeSupabase();
