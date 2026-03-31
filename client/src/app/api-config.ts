import { isDevMode } from '@angular/core';
import packageInfo from '../../package.json';

export const APP_VERSION = packageInfo.version;

// En producción, si el API está en el mismo dominio o gestionado por el mismo host
// podemos usar una URL relativa o la URL específica de EasyPanel.
// Por defecto, asumimos que en producción el API estará en el subdominio 'api'
// o simplemente cambiamos localhost por el host actual.

const getBaseUrl = (): string => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  
  const host = window.location.hostname;
  let result = '';
  
  if (host === 'localhost' || host === '127.0.0.1') {
    result = 'http://localhost:5000';
  } else if (host.includes('.easypanel.host')) {
    if (host.includes('-frontend')) {
      result = 'https://' + host.replace('-frontend', '-api');
    } else {
      // Si no tiene el sufijo -frontend, asumimos que es el nombre base (ej. Clinica SaaS.xxx)
      // y le agregamos -api (ej. clinicasaas-api.xxx)
      const parts = host.split('.');
      parts[0] = parts[0] + '-api';
      result = 'https://' + parts.join('.');
    }
    } else if (host.includes('nominusve.com')) {
    if (host === 'clinicasaas.nominusve.com') {
      result = 'https://clinicasaas-api.nominusve.com';
    } else {
      result = 'https://' + host.replace('Clinica SaaS.', 'clinicasaas-api.');
    }
  } else if (host.includes('medicalcare-888.com')) {
    result = 'https://api.medicalcare-888.com';
  }

  if (!result) {
    console.warn('⚠️ No se detectó entorno de producción. Usando rutas relativas.');
  } else {
    console.log(`🚀 Clinica SaaS API detectada: ${result}`);
  }

  return result;
};

export const BASE_URL = getBaseUrl();
export const API_URL = `${BASE_URL}/api`;
export const SOCKET_URL = BASE_URL || 'http://localhost:5000';

// Exponer para debug en consola
if (typeof window !== 'undefined') {
  (window as any).ClinicaSaaS_API_URL = API_URL;
  (window as any).ClinicaSaaS_BASE_URL = BASE_URL;
}
