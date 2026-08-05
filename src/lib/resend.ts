import { Resend } from 'resend';

// Evitar inicializar Resend cuando el envío está desactivado o no hay clave.
const isDevelopment = process.env.NODE_ENV === 'development';
const resendApiKey = process.env.RESEND_API_KEY?.trim() || '';
const emailDisabled = ['0', 'false', 'no', 'off'].includes(
  process.env.EMAIL_ENABLED?.trim().toLowerCase() || ''
);
const useMock = isDevelopment || !resendApiKey || emailDisabled;

let resend: Resend | { emails: { send: () => Promise<{ data: { id: string }; error: null }> } };

if (useMock) {
  if (isDevelopment || emailDisabled) {
    console.warn('Resend: Usando modo mock porque el envío está desactivado');
  }

  resend = {
    emails: {
      send: async () => {
        if (!resendApiKey && !isDevelopment && !emailDisabled) {
          throw new Error('RESEND_API_KEY no está configurada');
        }

        return { data: { id: 'mock-email-id' }, error: null };
      },
    },
  };
} else {
  resend = new Resend(resendApiKey);
}

export default resend;
