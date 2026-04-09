# MedicalCare 888 - Sistema de Gestión de Clínica SAAS

Sistema integral para la gestión de clínicas y videoconsultas médicas.

## 🚀 Despliegue de Producción (Vercel + Supabase)
- **Frontend**: Angular 21 (Servido desde `dist/client/browser`)
- **Backend**: Express.js (Funciones Serverless en `/api`)
- **Base de Datos**: Supabase PostgreSQL + Connection Pooler (IPv4)

### ⚙️ Configuración Crítica (Vercel Variables)
Para evitar errores de conectividad en entornos serverless (IPv6/IPv4), la `DATABASE_URL` **DEBE** usar el Transaction Pooler de Supabase:
`postgresql://postgres.[PROYECTO]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

### 🛠️ Inicialización del Sistema (Reset)

Existen dos tipos de inicialización disponibles mediante URL (requieren `key=v888`):

1. **Modo Producción (LIMPIO)**: Borra todo y deja solo tu cuenta maestra.
   `https://clinica-888.vercel.app/api/system/init-prod?key=v888`
   - *Credenciales:* `edwarvilchez1977@gmail.com` / `ClinicaSaaS123` (Pide cambio obligatorio).

2. **Modo Demo (CON DATOS)**: Borra todo y carga pacientes/doctores de prueba.
   `https://clinica-888.vercel.app/api/system/init-888?key=v888`

## 🛡️ Consola Maestro (Gestión Global)
El sistema incluye una consola de administración avanzada para el dueño de la plataforma y su equipo de ventas, accesible en `/platform-admin`.
- **Gestión de Organizaciones:** Visualización de todos los clientes, con capacidad para cambiar estados de suscripción (`ACTIVE`, `TRIAL`, `PAST_DUE`, `CANCELLED`).
- **Control de Usuarios:** Listado global de todos los usuarios registrados con opción de bloqueo inmediato (bypass de acceso).
- **Delegación Administrativa:** Los SuperAdmins pueden crear otras cuentas con privilegios de SuperAdmin para el equipo operativo.
- **Auditoría:** Todas las operaciones globales están protegidas y restringidas al rol `SUPERADMIN`.

## 📦 Gestión de Ramas (Git Flow)
1. **`develop`**: Desarrollo y correcciones.
2. **`staging`**: Pruebas de integración.
3. **`master`**: Rama productiva sincronizada con Vercel.

---
© 2026 MedicalCare 888. Desarrollado por CGK888Digital.
