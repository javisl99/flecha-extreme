import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/emailService';
import { TicketCompra } from '../../../emails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, type, data } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: 'to y subject son requeridos' },
        { status: 400 }
      );
    }

    const emailOptions: {
      to: string;
      subject: string;
      html?: string;
      text?: string;
      react?: React.ReactElement;
    } = {
      to,
      subject,
    };

    // Si es un email de tipo ticket de compra, usar la plantilla React
    if (type === 'ticket-compra' && data) {
      const { cliente, ticketData, ticketUrl } = data;
      
      if (!cliente || !ticketData || !ticketUrl) {
        return NextResponse.json(
          { success: false, error: 'Datos incompletos para ticket de compra' },
          { status: 400 }
        );
      }

      emailOptions.react = TicketCompra({
        cliente,
        ticketData,
        ticketUrl,
      });
    } else {
      // Para emails tradicionales con HTML/texto
      if (!html && !text) {
        return NextResponse.json(
          { success: false, error: 'html o text son requeridos para emails tradicionales' },
          { status: 400 }
        );
      }
      
      if (html) emailOptions.html = html;
      if (text) emailOptions.text = text;
    }

    const result = await sendEmail(emailOptions);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message,
        skipped: result.skipped,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en API send-email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
