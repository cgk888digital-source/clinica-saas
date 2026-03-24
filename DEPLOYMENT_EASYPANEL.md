# 🚀 Guía de Deployment en Easypanel - Clinica SaaS v1.8.1

## 📊 STATUS ACTUAL DEL PROYECTO

### ✅ Estado Git

- **Rama Actual:** develop
- **Último Commit:** bfe34f4 (v1.8.1)
- **Estado:** Working tree limpio
- **Ramas Sincronizadas:**
  - ✅ develop (local + remoto)
  - ✅ staging (local + remoto)
  - ✅ master (local + remoto)

### 📦 Componentes del Proyecto

- **Backend:** Node.js 18 + Express + PostgreSQL
- **Frontend:** Angular 21 (Standalone)
- **Base de Datos:** PostgreSQL 14
- **WebSockets:** Socket.io (VideoConsultas)

### ✅ Docker Files Existentes

- ✅ `docker-compose.yml` (raíz)
- ✅ `server/Dockerfile` (backend)
- ❌ `client/Dockerfile` (falta, lo crearemos)

---

## 🎯 ¿Qué es Easypanel?

**Easypanel** es una plataforma moderna de hosting/deployment similar a:

- Heroku
- Railway
- Vercel
- Render

**Características:**

- ✅ Deploy con Docker (nuestro caso)
- ✅ Deploy desde GitHub
- ✅ Base de datos PostgreSQL incluida
- ✅ SSL/HTTPS automático
- ✅ Monitoreo y logs
- ✅ Variables de entorno seguras
- ✅ CI/CD integrado

---

## 📋 PREREQUISITOS

### 1. Cuenta en Easypanel

```
https://easypanel.io
```

- Regístrate (tienen plan gratuito/trial)
- Conecta tu servidor (VPS) o usa su infraestructura

### 2. Repositorio en GitHub

```
✅ Ya tienes: https://github.com/edwarvilchez/Clinica SaaS-app
✅ Todas las ramas están actualizadas
```

### 3. Variables de Entorno Preparadas

```
Las configuraremos directamente en Easypanel
```

---

## 🛠️ PASO 1: Preparar Archivos Docker

### 1.1 Crear Dockerfile para el Frontend (Angular)

Crea `client/Dockerfile` (Nota: Angular 21 requiere Node 22+):

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build -- --configuration=production

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files
COPY --from=builder /app/dist/client/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 1.2 Crear archivo nginx.conf para Angular

Crea `client/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy (opcional si quieres routear al backend)
        location /api {
            proxy_pass http://server:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket support
        location /socket.io {
            proxy_pass http://server:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### 1.3 Actualizar server/Dockerfile (producción optimizada)

Reemplaza `server/Dockerfile` con:

```dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
CMD ["npm", "start"]
```

### 1.4 Crear .dockerignore para el Backend

Crea `server/.dockerignore`:

```
node_modules
npm-debug.log
.env
.git
.gitignore
*.md
test
coverage
.vscode
```

### 1.5 Crear .dockerignore para el Frontend

Crea `client/.dockerignore`:

```
node_modules
npm-debug.log
.angular
dist
.git
.gitignore
*.md
.vscode
```

### 1.6 Actualizar docker-compose.yml (Producción)

Reemplaza `docker-compose.yml`:

```yaml
version: "3.8"

services:
  # PostgreSQL Database
  db:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME:-Clinica SaaS}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - Clinica SaaS-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    restart: always
    ports:
      - "${PORT:-5000}:5000"
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-Clinica SaaS}
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      CLIENT_URL: ${CLIENT_URL}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_EMAIL: ${SMTP_EMAIL}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      FROM_NAME: ${FROM_NAME:-Clínica Clinica SaaS}
      FROM_EMAIL: ${FROM_EMAIL}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - Clinica SaaS-network
    volumes:
      - uploads_data:/usr/src/app/uploads

  # Frontend Angular
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
    depends_on:
      - server
    networks:
      - Clinica SaaS-network

volumes:
  postgres_data:
    driver: local
  uploads_data:
    driver: local

networks:
  Clinica SaaS-network:
    driver: bridge
```

---

## 🚀 PASO 2: Deployment en Easypanel

### 2.1 Conectar Repositorio GitHub

1. Accede a tu panel de Easypanel
2. Clic en **"New Project"**
3. Selecciona **"GitHub Repository"**
4. Conecta tu cuenta de GitHub
5. Selecciona el repositorio: `edwarvilchez/Clinica SaaS-app`
6. Rama: `master` (producción) o `develop` (testing)

### 2.2 Configurar Variables de Entorno

En Easypanel → Settings → Environment Variables:

```env
# Database
DB_NAME=Clinica SaaS_prod
DB_USER=Clinica SaaS_user
DB_PASSWORD=GENERA_UNA_CONTRASEÑA_SEGURA

# JWT
JWT_SECRET=GENERA_UN_SECRET_ALEATORIO_LARGO

# Email (Gmail ejemplo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=tu_email@gmail.com
SMTP_PASSWORD=TU_CONTRASENA_AQUI
FROM_NAME=Clínica Clinica SaaS
FROM_EMAIL=tu_email@gmail.com

# URLs (actualizar con tu dominio)
CLIENT_URL=https://tu-dominio.com
API_URL=https://api.tu-dominio.com

# Logging
LOG_LEVEL=info
NODE_ENV=production
PORT=5000
```

### 2.3 Configurar Base de Datos PostgreSQL

**Opción A: Usar PostgreSQL de Easypanel**

1. En tu proyecto → Add Service → PostgreSQL
2. Versión: 14
3. Easypanel creará automáticamente:
   - Database name
   - Username
   - Password
   - Connection string

**Opción B: Base de Datos Externa**

- Puedes usar Supabase, AWS RDS, etc.
- Solo actualiza las variables DB_HOST, DB_PORT, etc.

### 2.4 Deployment Automático

Easypanel detectará automáticamente `docker-compose.yml` y:

1. ✅ Construirá las imágenes Docker
2. ✅ Creará los servicios (db, server, client)
3. ✅ Configurará las redes
4. ✅ Asignará SSL/HTTPS automático
5. ✅ Iniciará los contenedores

### 2.5 Configurar Dominios

**Backend API:**

```
Easypanel te dará un subdominio: Clinica SaaS-api.easypanel.host
O configura tu dominio: api.tudominio.com
```

**Frontend:**

```
Easypanel te dará: Clinica SaaS.easypanel.host
O configura: www.tudominio.com
```

**Actualizar CORS:**

- En variables de entorno, actualiza `CLIENT_URL` con tu dominio real

---

## ⚙️ PASO 3: Post-Deployment

### 3.1 Ejecutar Migraciones

Una vez desplegado, accede a la consola del contenedor `server`:

```bash
npm run migrate
```

Esto creará las tablas en PostgreSQL.

### 3.2 Verificar Logs

```bash
# En Easypanel → Logs
# Verifica que:
✅ Database connected successfully
✅ Server is running on port 5000
✅ Security features enabled
```

### 3.3 Probar la API

```bash
curl https://api.tudominio.com/
# Debe retornar: {"message":"Welcome to Clinica SaaS API"}

# Swagger UI
https://api.tudominio.com/api-docs
```

### 3.4 Configurar CI/CD

Easypanel auto-despliega cuando haces push a la rama configurada:

```bash
# En local
git push origin master

# Easypanel detecta el cambio y re-despliega automáticamente
```

---

## 🔐 PASO 4: Seguridad en Producción

### 4.1 Variables de Entorno Seguras

✅ **JWT_SECRET:** Genera uno aleatorio

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

✅ **DB_PASSWORD:** Usa contraseñas fuertes

```
Mínimo 16 caracteres, letras + números + símbolos
```

### 4.2 HTTPS/SSL

✅ Easypanel configura SSL automáticamente con Let's Encrypt
✅ Fuerza HTTPS (redirige HTTP → HTTPS)

### 4.3 Firewall y Rate Limiting

✅ Ya implementado en v1.8.1:

- Rate limiting: 5 intentos/15min (auth)
- Helmet headers
- CORS configurado

---

## 📊 PASO 5: Monitoreo

### 5.1 Logs

Easypanel Panel → Logs:

- Ver logs en tiempo real
- Filtrar por servicio (db, server, client)
- Descargar logs históricos

### 5.2 Métricas

Easypanel Dashboard:

- CPU usage
- Memory usage
- Network I/O
- Request rate

### 5.3 Alertas

Configura alertas por email si:

- Servicio se cae
- CPU/Memory > 80%
- Errores frecuentes en logs

---

## 🔄 PASO 6: Workflow de Actualización

### Desarrollo → Producción

```bash
# 1. Desarrollar en rama develop
git checkout develop
# ... hacer cambios ...
git add .
git commit -m "feat: nueva feature"
git push origin develop

# 2. Probar en staging
git checkout staging
git merge develop
git push origin staging
# Easypanel despliega automáticamente en entorno staging

# 3. Producción
git checkout master
git merge staging
git push origin master
# Easypanel despliega automáticamente en producción
```

---

## 🆘 TROUBLESHOOTING

### Problema: Base de datos no conecta

**Solución:**

1. Verifica variables DB_HOST, DB_PORT en Easypanel
2. Si usas PostgreSQL de Easypanel, usa el internal hostname: `db:5432`
3. Verifica que el contenedor `db` esté healthy

### Problema: Error "database Clinica SaaS_prod does not exist"

**Causa:** El archivo `server/src/config/db.config.js` tenía nombres de base de datos hardcodeados (`Clinica SaaS_dev`, `Clinica SaaS_qa`, `Clinica SaaS_prod`) en lugar de usar la variable de entorno `DB_NAME`.

**Solución Aplicada (v1.8.1):**

```javascript
// ❌ ANTES (hardcoded)
production: {
  database: 'Clinica SaaS_prod',
  // ...
}

// ✅ DESPUÉS (usando env var)
production: {
  database: process.env.DB_NAME || 'Clinica SaaS_prod',
  // ...
}
```

**Pasos para verificar:**

1. Asegúrate de que `DB_NAME` esté configurado en las variables de entorno de EasyPanel
2. El valor debe coincidir con el nombre de la base de datos creada en PostgreSQL
3. Ejemplo: `DB_NAME=Clinica SaaS_app_db`

### Problema: Error "password authentication failed for user postgres"

**Causa:** Las credenciales en las variables de entorno del API no coinciden con las credenciales de PostgreSQL.

**Solución:**

1. Ve al servicio PostgreSQL en EasyPanel
2. Copia las credenciales exactas (Usuario, Contraseña, Base de datos)
3. Actualiza las variables de entorno del API:
   ```env
   DB_USER=Clinica SaaS_app_admin  # Debe coincidir exactamente
   DB_PASSWORD=TU_CONTRASENA_SEGURA_AQUI
   DB_NAME=Clinica SaaS_app_db      # Debe coincidir exactamente
   DB_HOST=Clinica SaaS_app_Clinica SaaS_app_db  # Nombre interno del servicio
   ```
4. Reinicia el servicio API (click en "Implementar")

### Problema: Frontend no carga el API

**Solución:**

1. Verifica CORS en `server/src/index.js`
2. Actualiza `CLIENT_URL` en variables de entorno
3. Verifica que nginx.conf tenga el proxy correcto

### Problema: WebSocket no funciona

**Solución:**

1. Verifica que nginx.conf tenga la configuración `/socket.io`
2. Asegúrate de que Socket.io esté en el mismo dominio o configurado con CORS

### Problema: Migraciones fallan

**Solución:**

```bash
# Accede al contenedor
docker exec -it Clinica SaaS-server sh

# Ejecuta manualmente
npx sequelize-cli db:migrate

# O resetea BD (¡cuidado en producción!)
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```

---

## ✅ CHECKLIST PRE-DEPLOYMENT

- [ ] Crear `client/Dockerfile`
- [ ] Crear `client/nginx.conf`
- [ ] Actualizar `server/Dockerfile`
- [ ] Crear `.dockerignore` (server + client)
- [ ] Actualizar `docker-compose.yml`
- [ ] Generar JWT_SECRET seguro
- [ ] Configurar variables de entorno en Easypanel
- [ ] Configurar dominio personalizado
- [ ] Probar build local: `docker-compose up`
- [ ] Hacer push a GitHub
- [ ] Conectar GitHub con Easypanel
- [ ] Verificar deployment
- [ ] Ejecutar migraciones
- [ ] Probar API y Frontend
- [ ] Verificar logs

---

## 📚 RECURSOS ADICIONALES

- **Easypanel Docs:** https://easypanel.io/docs
- **Docker Docs:** https://docs.docker.com
- **PostgreSQL:** https://www.postgresql.org/docs
- **Nginx:** https://nginx.org/en/docs

---

## 🎯 RESULTADO ESPERADO

Después de seguir esta guía, tendrás:

✅ **API Backend:** https://api.tudominio.com

- Swagger: https://api.tudominio.com/api-docs
- Health: https://api.tudominio.com/

✅ **Frontend Angular:** https://www.tudominio.com

- SPA con routing
- Proxy a API configurado

✅ **Base de Datos:** PostgreSQL 14 (privada, solo accesible internamente)

✅ **CI/CD:** Auto-deploy desde GitHub

✅ **SSL/HTTPS:** Configurado automáticamente

✅ **Monitoreo:** Logs + métricas en dashboard

---

**🚀 ¡Listo para desplegar Clinica SaaS v1.8.1 en producción!**

### Error: "Node.js version v18.20.8 detected. The Angular CLI requires a minimum Node.js version of v20.19 or v22.12."

- **Causa**: Angular 21 (o versiones recientes) requieren Node 20 o 22.
- **Solución**: Cambiar `FROM node:18-alpine` a `FROM node:22-alpine` en el `Dockerfile` del frontend.

### Error: "nginx.conf not found" durante el Build

- **Causa**: Contexto del build incorrecto o archivo mal ubicado.
- **Solución**: Asegurarse de que en EasyPanel, el "Directorio del Proyecto" sea `/client` y el "Archivo del Dockerfile" sea `Dockerfile`.

---

_Última actualización: 16 de febrero de 2026_
