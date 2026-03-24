# 🔐 Guía de Seeding Seguro en Producción

## ⚠️ IMPORTANTE - Seguridad

Los archivos con credenciales de prueba (`CREDENCIALES_TESTING.txt`, `USUARIOS_PRUEBA.md`) **NO están incluidos en el repositorio** por razones de seguridad. Estos archivos solo existen localmente en tu máquina de desarrollo.

## 📋 Pasos para Seed en Producción

### Opción 1: Seeding Completo (Recomendado para primera vez)

1. **Conectarse al servidor de producción** (SSH, panel de control, etc.)

2. **Navegar al directorio del servidor:**

   ```bash
   cd /path/to/Clinica SaaS/server
   ```

3. **Configurar variables de entorno:**

   Editar el archivo `.env` en producción y agregar:

   ```env
   # Seeding Configuration
   NODE_ENV=production
   SEED_TEST_USERS=true
   TEST_PASSWORD=YOUR_SECURE_PASSWORD_HERE
   ```

4. **Ejecutar el script de seeding:**

   ```bash
   node seed_production.js
   ```

5. **Verificar la salida:**

   ```
   🌱 Iniciando seeding de producción...
   ✅ Conexión a base de datos establecida
   📋 Seeding roles del sistema...
   ✅ Roles creados correctamente
   🏥 Seeding datos base del sistema...
   ✅ Datos base creados correctamente
   👥 Seeding usuarios de prueba...
   ✅ Usuarios de prueba creados correctamente
   🎉 Seeding de producción completado exitosamente!
   ```

6. **IMPORTANTE - Limpiar después:**

   Una vez verificado que todo funciona, **eliminar o comentar** las siguientes líneas del `.env`:

   ```env
   # SEED_TEST_USERS=true
   # TEST_PASSWORD=...
   ```

### Opción 2: Solo Roles y Datos Base (Sin usuarios de prueba)

Si solo necesitas los roles y datos base del sistema (sin usuarios de prueba):

1. **Configurar `.env` en producción:**

   ```env
   NODE_ENV=production
   SEED_TEST_USERS=false
   ```

2. **Ejecutar:**
   ```bash
   node seed_production.js
   ```

### Opción 3: Seeding Manual desde Consola de Base de Datos

Si prefieres crear usuarios manualmente:

1. **Conectarse a PostgreSQL:**

   ```bash
   psql -U postgres -d Clinica SaaS_production
   ```

2. **Crear usuario administrador:**

   ```sql
   -- Primero, obtener el ID del rol SUPERADMIN
   SELECT id FROM "Roles" WHERE name = 'SUPERADMIN';

   -- Crear usuario (ajustar el roleId según el resultado anterior)
   INSERT INTO "Users" (
     id, email, username, password, "firstName", "lastName",
     "roleId", "isActive", "createdAt", "updatedAt"
   ) VALUES (
     gen_random_uuid(),
     'admin@tudominio.com',
     'admin',
     '$2a$10$...',  -- Hash bcrypt de la contraseña
     'Administrador',
     'Sistema',
     'ID_DEL_ROL_SUPERADMIN',
     true,
     NOW(),
     NOW()
   );
   ```

## 🔑 Generar Hash de Contraseña

Para generar el hash bcrypt de una contraseña:

```javascript
// En Node.js (puedes ejecutar esto localmente)
const bcrypt = require("bcryptjs");
const password = "YOUR_PASSWORD_HERE"; // Reemplaza con tu contraseña real
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

O usando un script rápido:

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
```

## 📊 Verificar Usuarios Creados

Después del seeding, verifica que los usuarios se crearon correctamente:

```bash
# Desde el servidor
node -e "
const { User, Role } = require('./src/models');
User.findAll({ include: [Role] }).then(users => {
  console.log('Usuarios creados:', users.length);
  users.forEach(u => console.log('-', u.email, '|', u.Role?.name));
  process.exit(0);
});
"
```

## 🛡️ Mejores Prácticas de Seguridad

1. ✅ **Nunca** commits archivos con contraseñas al repositorio
2. ✅ Usa contraseñas **fuertes y únicas** para producción
3. ✅ Cambia las contraseñas de prueba inmediatamente después de verificar el sistema
4. ✅ Elimina usuarios de prueba una vez que tengas usuarios reales
5. ✅ Usa variables de entorno para credenciales sensibles
6. ✅ Mantén `.env` fuera del control de versiones (ya está en `.gitignore`)

## 🔄 Actualizar Usuarios Existentes

Si necesitas actualizar la contraseña de un usuario existente:

```bash
node -e "
const bcrypt = require('bcryptjs');
const { User } = require('./src/models');
const newPassword = 'YOUR_NEW_PASSWORD_HERE';  // Reemplaza con tu nueva contraseña
const hash = bcrypt.hashSync(newPassword, 10);
User.update({ password: hash }, { where: { email: 'admin@tudominio.com' } })
  .then(() => { console.log('✅ Contraseña actualizada'); process.exit(0); });
"
```

## 📞 Soporte

Si encuentras problemas durante el seeding:

1. Verifica que la base de datos esté corriendo
2. Confirma que las credenciales de DB en `.env` son correctas
3. Revisa los logs del servidor para errores específicos
4. Asegúrate de que las migraciones se ejecutaron correctamente

---

**Última actualización:** 2026-02-16  
**Versión:** 1.8.3
