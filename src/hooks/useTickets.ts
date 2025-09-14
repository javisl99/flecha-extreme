import { useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import supabaseClient from '@/lib/supabaseClient';

interface TicketData {
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  subtotal: number;
  descuento: number;
  discountPercentage: number;
  iva: number;
  total: number;
  metodoPago: string;
  fecha: Date;
  pedidoId?: string;
}

interface TicketResult {
  success: boolean;
  url?: string;
  qrCode?: string;
  error?: string;
}

export function useTickets() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para generar el PDF del ticket
  const generateTicketPDF = async (data: TicketData): Promise<jsPDF> => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Tamaño de ticket estándar (80mm de ancho)
    });

    // Configurar fuente monospace para el ticket
    doc.setFont('courier', 'normal');
    
    let yPosition = 10;
    const lineHeight = 5;
    const pageWidth = 80;
    const margin = 5;

    // Función auxiliar para centrar texto
    const centerText = (text: string, y: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
    };

    // Función auxiliar para dibujar línea separadora
    const drawSeparator = (y: number) => {
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
    };

    // Función auxiliar para dibujar asteriscos
    const drawAsterisks = (y: number) => {
      const asterisks = '******************************';
      centerText(asterisks, y, 8);
    };

    // Función para formatear números en formato español
    const formatSpanishNumber = (num: number): string => {
      return num.toFixed(2).replace('.', ',');
    };

    // Función auxiliar para dibujar texto justificado a la derecha
    const rightAlignText = (text: string, y: number, fontSize: number = 8) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const x = pageWidth - margin - textWidth;
      doc.text(text, x, y);
    };

    // Función para cargar y procesar la imagen del logo
    const loadLogoImage = async (): Promise<string | null> => {
      try {
        // Crear un canvas para procesar la imagen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Crear una nueva imagen
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
        
        return new Promise((resolve) => {
          img.onload = () => {
            // Configurar el tamaño del canvas
            const logoWidth = 30; // mm
            const logoHeight = 15; // mm
            canvas.width = logoWidth * 3.78; // Convertir mm a pixels (aproximadamente)
            canvas.height = logoHeight * 3.78;

            // Aplicar filtros para convertir a blanco y negro
            ctx.filter = 'grayscale(100%) contrast(200%) brightness(75%)';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convertir a base64
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
          };
          
          img.onerror = () => {
            console.warn('No se pudo cargar el logo, usando texto como fallback');
            resolve(null);
          };
          
          // Cargar la imagen
          img.src = '/cropped-lgo.png';
        });
      } catch (error) {
        console.warn('Error procesando el logo:', error);
        return null;
      }
    };

    // Header - Logo y nombre de la empresa
    try {
      const logoDataURL = await loadLogoImage();
      
      if (logoDataURL) {
        // Agregar el logo al PDF
        const logoWidth = 30; // mm
        const logoHeight = 15; // mm
        const logoX = (pageWidth - logoWidth) / 2; // Centrar horizontalmente
        
        doc.addImage(logoDataURL, 'PNG', logoX, yPosition, logoWidth, logoHeight);
        yPosition += logoHeight + 3; // Espacio después del logo
      } else {
        // Fallback al texto si no se puede cargar el logo
        centerText('FLECHA EXTREME', yPosition, 12);
        yPosition += lineHeight;
      }
    } catch (error) {
      console.warn('Error agregando logo al PDF:', error);
      // Fallback al texto
      centerText('FLECHA EXTREME', yPosition, 12);
      yPosition += lineHeight;
    }
    
    centerText('Urb. Portil Ca-C 1', yPosition, 8);
    yPosition += lineHeight;
    
    centerText('21100 Nuevo Portil, Huelva', yPosition, 8);
    yPosition += lineHeight;
    
    centerText('Tel. 617000546', yPosition, 8);
    yPosition += lineHeight + 2;

    // Separador con asteriscos
    drawAsterisks(yPosition);
    yPosition += lineHeight;

    // Título del recibo
    centerText('RECIBO DE COMPRA', yPosition, 10);
    yPosition += lineHeight + 2;

    // Separador con asteriscos
    drawAsterisks(yPosition);
    yPosition += lineHeight;

    // Fecha y hora
    doc.setFontSize(8);
    doc.text(`Fecha: ${data.fecha.toLocaleDateString('es-ES')}`, margin, yPosition);
    yPosition += lineHeight;
    
    doc.text(`Hora: ${data.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Separador con asteriscos
    drawAsterisks(yPosition);
    yPosition += lineHeight;

    // Header de productos
    doc.setFontSize(8);
    doc.text('Descripción', margin, yPosition);
    rightAlignText('Precio', yPosition, 8);
    yPosition += lineHeight;

    // Productos
    data.cartItems.forEach(item => {
      const itemName = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
      const quantity = item.quantity > 0 ? ` x${item.quantity}` : '';
      const price = formatSpanishNumber(item.id === 'producto-desconocido' ? item.price : item.price * item.quantity);
      
      doc.text(itemName + quantity, margin, yPosition);
      rightAlignText(`${price}€`, yPosition, 8);
      yPosition += lineHeight;
    });

    yPosition += 2;

    // Separador con asteriscos
    drawAsterisks(yPosition);
    yPosition += lineHeight;

    // Totales
    doc.setFontSize(8);
    doc.text('Subtotal:', margin, yPosition);
    rightAlignText(`${formatSpanishNumber(data.subtotal)}€`, yPosition, 8);
    yPosition += lineHeight;

    doc.text('IVA incluido (21%):', margin, yPosition);
    rightAlignText(`${formatSpanishNumber(data.iva)}€`, yPosition, 8);
    yPosition += lineHeight;

    if (data.discountPercentage > 0) {
      doc.text(`Descuento (${data.discountPercentage}%):`, margin, yPosition);
      rightAlignText(`-${formatSpanishNumber(data.descuento)}€`, yPosition, 8);
      yPosition += lineHeight;
    }

    // Línea separadora antes del total
    drawSeparator(yPosition);
    yPosition += 4; // Aumentar el espaciado después de la línea

    // Total final
    doc.setFontSize(10);
    doc.setFont('courier', 'bold');
    doc.text('TOTAL:', margin, yPosition);
    rightAlignText(`${formatSpanishNumber(data.total)}€`, yPosition, 10);
    yPosition += lineHeight + 2;

    // Separador con asteriscos
    drawAsterisks(yPosition);
    yPosition += lineHeight;

    // Método de pago
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(`Método de pago: ${data.metodoPago}`, margin, yPosition);
    yPosition += lineHeight + 2;

    // Separador con asteriscos
    drawAsterisks(yPosition);
    yPosition += lineHeight;

    // Mensaje de agradecimiento
    centerText('¡GRACIAS!', yPosition, 10);

    return doc;
  };

  // Función para guardar el ticket en Supabase Storage
  const saveTicket = async (data: TicketData): Promise<TicketResult> => {
    try {
      setLoading(true);
      setError(null);

      // Generar el PDF del ticket
      const pdfDoc = await generateTicketPDF(data);
      
      // Generar el PDF como blob
      const pdfBlob = pdfDoc.output('blob');
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `ticket_${data.pedidoId || 'temp'}_${timestamp}.pdf`;
      
      // Subir el archivo al bucket 'tickets'
      const { error: uploadError } = await supabaseClient
        .storage
        .from('tickets')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Error al subir el ticket: ${uploadError.message}`);
      }

      // Obtener la URL pública del archivo
      const { data: { publicUrl } } = supabaseClient
        .storage
        .from('tickets')
        .getPublicUrl(fileName);

      // Si tenemos un pedidoId, actualizar la tabla pedido con la URL del ticket
      if (data.pedidoId) {
        try {
          const { error: updateError } = await supabaseClient
            .from('pedido')
            .update({ ticket_url: publicUrl })
            .eq('id', data.pedidoId);

          if (updateError) {
            console.warn('No se pudo actualizar la URL del ticket en la tabla pedido:', updateError.message);
            // Si el error es porque la columna no existe, mostrar un mensaje más específico
            if (updateError.message.includes('column "ticket_url" does not exist')) {
              console.warn('La columna ticket_url no existe en la tabla pedido. Ejecuta el script add_ticket_url_column.sql en Supabase SQL Editor.');
            }
            // No lanzamos error aquí porque el ticket ya se guardó correctamente
          }
        } catch (err) {
          console.warn('Error al actualizar la URL del ticket en la tabla pedido:', err);
          // No lanzamos error aquí porque el ticket ya se guardó correctamente
        }
      }

      return {
        success: true,
        url: publicUrl
      };

    } catch (err) {
      console.error('Error guardando ticket:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al guardar el ticket';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para generar QR del ticket
  const generateTicketQR = async (data: TicketData): Promise<TicketResult> => {
    try {
      setLoading(true);
      setError(null);

      // Primero guardar el ticket (ahora como PDF)
      const saveResult = await saveTicket(data);
      
      if (!saveResult.success || !saveResult.url) {
        return saveResult;
      }

      // Generar el código QR que apunte a la URL del ticket PDF
      const qrCodeDataURL = await QRCode.toDataURL(saveResult.url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        success: true,
        url: saveResult.url,
        qrCode: qrCodeDataURL
      };

    } catch (err) {
      console.error('Error generando QR del ticket:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al generar el QR';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un ticket del bucket
  const deleteTicket = async (ticketUrl: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Extraer el nombre del archivo de la URL
      const urlParts = ticketUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Eliminar el archivo del bucket 'tickets'
      const { error: deleteError } = await supabaseClient
        .storage
        .from('tickets')
        .remove([fileName]);

      if (deleteError) {
        throw new Error(`Error al eliminar el ticket: ${deleteError.message}`);
      }

      return true;
    } catch (err) {
      console.error('Error eliminando ticket:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al eliminar el ticket';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    saveTicket,
    generateTicketQR,
    deleteTicket
  };
}
