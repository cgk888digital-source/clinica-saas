# MedicalCare 888 - Guía de Despliegue v2.7.0 (Vercel + Supabase)

Esta guía documenta la infraestructura profesionalizada para el monorepo de MedicalCare 888.

## 🏗️ Arquitectura de Despliegue

- **Frontend**: Angular 21 (Ruta: `/client`)
- **Backend Bridge**: Node.js Proxy (Ruta: `/api/server.js`)
- **Backend Core**: Express Server (Ruta: `/server/src`)
- **Base de Datos**: Supabase (PostgreSQL con Connection Pooling)

## 🛰️ Configuración en Vercel

- **Root Directory**: `.` (Raíz del proyecto)
- **Settings**: "Include files outside the root directory in the Build Step" debe estar **HABILITADO**.
- **Enrutamiento**: Controlado por `vercel.json` con rutas absolutas:
  - `/api/*` -> `/api/server.js`
  - `/*` -> `/client/dist/client/browser/$1`

## 🚀 Pipeline de CI/CD (GitHub Actions)

El despliegue es automático desde la rama **master**. Se utiliza el comando nativo de Vercel en la nube para asegurar el correcto mapeo de funciones serverless y archivos estáticos.

## 🛠️ Inicialización de Base de Datos

Una vez desplegado en producción, es obligatorio ejecutar la inyección del esquema visitando:
`https://clinica-888.vercel.app/api/system/init-888?key=v888`

---
*Mantenido por el equipo de Arquitectura Elite MC888 - 2026*
