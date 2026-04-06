# MedicalCare 888 - Sistema de Gestión de Clínica SAAS

Sistema integral para la gestión de clínicas y videoconsultas médicas.

## 🚀 Despliegue de Producción (Abril 2026)
- **Frontend**: Angular 21 (Vercel)
- **Backend**: Node.js/Express Serverless (Vercel)
- **Base de Datos**: Supabase (PostgreSQL) con Transaction Pooler (Puerto 6543)
- **Estado**: Producción Validada ✅

## 🛠️ Configuración de Variables de Entorno (Vercel)
Para el correcto funcionamiento en producción, se deben configurar las siguientes variables en el panel de Vercel:
- `DATABASE_URL`: Transaction pooler URL (Puerto 6543)
- `JWT_SECRET`: Clave de firma para tokens
- `NODE_ENV`: `production`

## 📦 Flujo de Trabajo (Git)
1. `develop`: Rama de desarrollo principal.
2. `staging`: Rama de pruebas y prepromoción.
3. `master`: Rama de producción (Despliegue automático en Vercel).

---
© 2026 MedicalCare 888. Todos los derechos reservados.
