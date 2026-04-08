# MedicalCare 888 - Sistema de Gestión de Clínica SAAS

Sistema integral para la gestión de clínicas y videoconsultas médicas.

## 🚀 Despliegue de Producción (Vercel + Supabase)
- **Frontend**: Angular 21 (Servido desde `dist/client/browser`)
- **Backend**: Express.js (Funciones Serverless en `/api`)
- **Base de Datos**: Supabase PostgreSQL + Connection Pooler (IPv4)

### ⚙️ Configuración Crítica (Vercel Variables)
Para evitar errores de conectividad en entornos serverless (IPv6/IPv4), la `DATABASE_URL` **DEBE** usar el Transaction Pooler de Supabase:
`postgresql://postgres.[PROYECTO]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

### 🛠️ Inicialización del Sistema
Tras un nuevo despliegue o reset de base de datos, ejecutar la ruta de emergencia:
`https://clinica-888.vercel.app/api/system/init-888?key=v888`
*Esto recrea el esquema (`force: true`) y carga los usuarios administradores de prueba.*

## 📦 Gestión de Ramas (Git Flow)
1. **`develop`**: Desarrollo y correcciones.
2. **`staging`**: Pruebas de integración.
3. **`master`**: Rama productiva sincronizada con Vercel.

---
© 2026 MedicalCare 888. Todos los derechos reservados.

