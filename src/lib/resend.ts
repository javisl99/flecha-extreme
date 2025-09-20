import { Resend } from 'resend';

// Verificar si estamos en modo de desarrollo y usar mock en ese caso
const isDevelopment = process.env.NODE_ENV === 'development';
const resendApiKey = process.env.RESEND_API_KEY || '';

let resend;

if (isDevelopment && !resendApiKey) {
  console.warn('Resend: Usando modo mock para desarrollo local');
  // Crear un mock básico de Resend para desarrollo
  resend = {
    emails: {
      send: async () => ({ data: { id: 'mock-email-id' }, error: null }),
    },
  };
} else {
  resend = new Resend(resendApiKey);
}

export default resend;
