import resend from './resend';

// Configuración del remitente
const FROM_EMAIL = 'Flecha Extreme <noreply@flechaextreme.com>';

// Tipos para los emails
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
}

// Función principal para enviar emails
export async function sendEmail(options: EmailOptions) {
  try {
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
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Error de Resend al enviar email:', error);
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }

    console.log('Email enviado exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error en sendEmail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: errorMessage };
  }
}
