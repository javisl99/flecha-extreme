import { useState } from 'react';
import { Cliente, TicketData } from '../lib/emailTemplates';

interface EmailResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  type?: string;
  data?: unknown;
}

export function useEmailAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (options: EmailOptions): Promise<EmailResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'Error al enviar el email');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const sendTicketEmail = async (
    cliente: Cliente,
    ticketData: TicketData,
    ticketUrl: string,
    estadoPago?: 'completado' | 'pendiente' | 'cancelado'
  ): Promise<EmailResponse> => {
    return sendEmail({
      to: cliente.email,
      subject: '¡Gracias por tu compra en Flecha Extreme!',
      type: 'ticket-compra',
      data: {
        cliente,
        ticketData,
        ticketUrl,
        estadoPago,
      },
    });
  };

  const clearError = () => setError(null);

  return {
    loading,
    error,
    sendEmail,
    sendTicketEmail,
    clearError,
  };
}
