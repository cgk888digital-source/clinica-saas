# 🚀 Guía Rápida de Deployment - Clinica SaaS en EasyPanel

## ✅ Estado Actual del Proyecto

**Versión:** v1.8.1  
**Repositorio:** https://github.com/edwarvilchez/Clinica SaaS-app  
**Rama Principal:** master  
**Stack:** PEAN (PostgreSQL + Express + Angular + Node.js)

---

## 📦 Archivos Docker Preparados

✅ **Backend:**

- `server/Dockerfile` - Optimizado para producción
- `server/.dockerignore` - Excluye archivos innecesarios

✅ **Frontend:**

- `client/Dockerfile` - Build multi-stage con Nginx
- `client/nginx.conf` - Con proxy API y WebSocket habilitados
- `client/.dockerignore` - Excluye archivos innecesarios

✅ **Orquestación:**

- `docker-compose.yml` - Configuración completa (db + server + client)

✅ **Configuración:**

- `.env.production` - Template de variables de entorno

---

## 🎯 PASOS PARA DEPLOYMENT EN EASYPANEL

### 1️⃣ Preparar Repositorio GitHub

```bash
# Ya hecho - Los archivos Docker están listos
# Solo necesitas hacer push de los últimos cambios
```

### 2️⃣ Conectar EasyPanel con GitHub

1. **Accede a EasyPanel:** https://easypanel.io
2. **Crea un nuevo proyecto:**
   - Click en "**+ Servicio**"
   - Selecciona "**GitHub**"
   - Autoriza EasyPanel a acceder a tu cuenta GitHub

3. **Configura el repositorio:**
   - **Propietario:** `edwarvilchez`
   - **Repositorio:** `https://github.com/edwarvilchez/Clinica SaaS-app.git`
   - **Rama:** `master` (producción) o `develop` (testing)
   - **Ruta de compilación:** `/` (raíz, porque usamos docker-compose)

### 3️⃣ Configurar Variables de Entorno

En EasyPanel → **Tu Proyecto** → **Settings** → **Environment Variables**

Copia y pega estas variables (actualiza los valores marcados con `CHANGE_THIS`):

```env
# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=Clinica SaaS_prod
DB_USER=Clinica SaaS_user
DB_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD

# JWT Secret (genera uno con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=CHANGE_THIS_TO_RANDOM_SECRET_KEY

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_NAME=Clínica Clinica SaaS
FROM_EMAIL=your-email@gmail.com

# URLs (EasyPanel te dará estos dominios)
CLIENT_URL=https://Clinica SaaS.easypanel.host
API_URL=https://Clinica SaaS-api.easypanel.host

# Application
NODE_ENV=production
PORT=5000
LOG_LEVEL=info
```

**🔐 Generar JWT_SECRET seguro:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4️⃣ Configurar Base de Datos PostgreSQL

**Opción A: Usar PostgreSQL de EasyPanel (Recomendado)**

1. En tu proyecto → Click "**+ Servicio**"
2. Selecciona "**PostgreSQL**"
3. Versión: **14**
4. EasyPanel creará automáticamente:
   - Database name
   - Username
   - Password
   - Internal hostname (usa esto en `DB_HOST`)

5. **Actualiza las variables de entorno** con los valores que EasyPanel te proporcione

**Opción B: Base de Datos Externa**

- Usa Supabase, AWS RDS, o cualquier PostgreSQL externo
- Actualiza `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### 5️⃣ Deploy Automático

EasyPanel detectará `docker-compose.yml` y automáticamente:

1. ✅ Construirá las 3 imágenes Docker (db, server, client)
2. ✅ Creará los servicios y redes
3. ✅ Asignará SSL/HTTPS automático
4. ✅ Iniciará los contenedores

**Tiempo estimado:** 5-10 minutos

### 6️⃣ Ejecutar Migraciones de Base de Datos

Una vez desplegado, accede a la **consola del contenedor `server`**:

```bash
# En EasyPanel → Server Service → Console
npm run migrate
```

Esto creará todas las tablas en PostgreSQL.

### 7️⃣ Configurar Dominios Personalizados (Opcional)

**Por defecto, EasyPanel te da:**

- Frontend: `https://Clinica SaaS.easypanel.host`
- Backend: `https://Clinica SaaS-api.easypanel.host`

**Para usar tu propio dominio:**

1. En EasyPanel → **Domains**
2. Agrega tu dominio: `www.tudominio.com`
3. Configura DNS en tu proveedor:
   ```
   Type: CNAME
   Name: www
   Value: [valor que EasyPanel te proporcione]
   ```
4. EasyPanel configurará SSL automáticamente

**Actualiza las variables de entorno:**

```env
CLIENT_URL=https://www.tudominio.com
API_URL=https://api.tudominio.com
```

---

## ✅ Verificación Post-Deployment

### 1. Verificar API Backend

```bash
# Health check
curl https://Clinica SaaS-api.easypanel.host/

# Debe retornar: {"message":"Welcome to Clinica SaaS API"}
```

### 2. Verificar Swagger UI

```
https://Clinica SaaS-api.easypanel.host/api-docs
```

### 3. Verificar Frontend

```
https://Clinica SaaS.easypanel.host
```

### 4. Verificar Logs

En EasyPanel → **Logs** → Verifica que no haya errores:

```
✅ Database connected successfully
✅ Server is running on port 5000
✅ Security features enabled
```

---

## 🔄 CI/CD Automático

EasyPanel auto-despliega cuando haces push a la rama configurada:

```bash
# En local
git add .
git commit -m "feat: nueva feature"
git push origin master

# EasyPanel detecta el cambio y re-despliega automáticamente
```

---

## 🔐 Seguridad en Producción

✅ **Ya implementado en v1.8.1:**

- Rate limiting (5 intentos/15min en auth)
- Helmet security headers
- CORS configurado
- HTTPS/SSL automático (EasyPanel)
- Passwords hasheados con bcrypt
- JWT authentication

✅ **Asegúrate de:**

- Usar contraseñas fuertes (min 16 caracteres)
- Generar JWT_SECRET único y aleatorio
- Usar Gmail App Passwords (no tu contraseña principal)
- No commitear `.env` con credenciales reales

---

## 🆘 Troubleshooting

### ❌ Error: "Repository not found"

**Solución:** Verifica que:

1. El repositorio sea `Clinica SaaS-app` (no `nominus`)
2. La URL sea: `https://github.com/edwarvilchez/Clinica SaaS-app.git`
3. EasyPanel tenga permisos para acceder al repositorio

### ❌ Error: "Database connection failed"

**Solución:**

1. Verifica que el servicio PostgreSQL esté corriendo
2. Usa el **internal hostname** de EasyPanel (ej: `db:5432`)
3. Verifica las credenciales en variables de entorno

### ❌ Error: "Frontend no carga el API"

**Solución:**

1. Verifica que `nginx.conf` tenga el proxy habilitado ✅ (ya está)
2. Actualiza `CLIENT_URL` en variables de entorno
3. Verifica CORS en el backend

### ❌ Error: "WebSocket no funciona"

**Solución:**

1. Verifica que `nginx.conf` tenga `/socket.io` configurado ✅ (ya está)
2. Asegúrate de que Socket.io use el mismo dominio
3. Verifica que CORS permita WebSocket connections

---

## 📊 Monitoreo

### Logs en Tiempo Real

```
EasyPanel → Tu Proyecto → Logs
```

### Métricas

```
EasyPanel → Dashboard
- CPU usage
- Memory usage
- Network I/O
- Request rate
```

### Alertas

Configura alertas por email si:

- Servicio se cae
- CPU/Memory > 80%
- Errores frecuentes

---

## 🎉 ¡Listo!

Después de seguir estos pasos, tendrás:

✅ **API Backend:** https://Clinica SaaS-api.easypanel.host  
✅ **Frontend Angular:** https://Clinica SaaS.easypanel.host  
✅ **Base de Datos:** PostgreSQL 14 (privada)  
✅ **CI/CD:** Auto-deploy desde GitHub  
✅ **SSL/HTTPS:** Configurado automáticamente  
✅ **Monitoreo:** Logs + métricas en dashboard

---

**Última actualización:** 15 de Febrero, 2026  
**Versión:** v1.8.1  
**Stack:** PEAN (PostgreSQL + Express + Angular + Node.js)
