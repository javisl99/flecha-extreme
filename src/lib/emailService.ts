import resend from './resend';

// Configuración del remitente
const FROM_EMAIL = 'Flecha Extreme <contacto@flechaextreme.com>';

function isEmailEnabled() {
  const value = process.env.EMAIL_ENABLED?.trim().toLowerCase();

  if (!value) {
    return true;
  }

  return ['1', 'true', 'yes', 'on'].includes(value);
}

// Tipos para los emails
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
}

export interface EmailResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
  skipped?: boolean;
}

// Función principal para enviar emails
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    if (!isEmailEnabled()) {
      return {
        success: true,
        skipped: true,
        message: 'Envio de emails desactivado por configuracion',
        data: { id: 'email-disabled' },
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailData: any = {
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
    };

    // Si se proporciona un componente React, usarlo; si no, usar HTML/texto
    if (options.react) {
      emailData.react = options.react;
    } else {
      if (options.html) emailData.html = options.html;
      if (options.text) emailData.text = options.text;
      // Asegurar que siempre hay texto o HTML
      if (!emailData.html && !emailData.text) {
        emailData.text = options.subject; // Usar el subject como texto por defecto
      }
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Error de Resend al enviar email:', error);
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en sendEmail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: errorMessage };
  }
}
