import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import { Cliente, TicketData } from '../lib/emailTemplates';

interface TicketCompraProps {
  cliente: Cliente;
  ticketData: TicketData;
  ticketUrl: string;
}

export default function TicketCompra({
  cliente,
  ticketData,
  ticketUrl,
}: TicketCompraProps) {
  const formatPrice = (price: number): string => {
    return price.toFixed(2).replace('.', ',') + '€';
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="date=no" />
        <meta name="format-detection" content="address=no" />
        <meta name="format-detection" content="email=no" />
        <style>{`
          /* Forzar modo claro - sobrescribir cualquier tema oscuro */
          * {
            color-scheme: light !important;
          }
          body, html {
            background-color: #f9fafb !important;
            color: #111827 !important;
          }
          
          /* Estilos específicos para Gmail */
          u + .body .gmail-fix {
            display: none !important;
          }
          
          /* Forzar colores en Gmail */
          [data-ogsc] {
            background-color: #f9fafb !important;
            color: #111827 !important;
          }
          
          /* Sobrescribir estilos de Gmail */
          .gmail-fix {
            background-color: #f9fafb !important;
            color: #111827 !important;
          }
          
          /* Forzar contenedor principal en Gmail */
          div[style*="background-color"] {
            background-color: #f9fafb !important;
          }
          
          /* Forzar texto en Gmail */
          span[style*="color"] {
            color: #111827 !important;
          }
          .hover-bg-yellow-500:hover {
            background-color: #eab308 !important;
          }
          .brand-gradient {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%) !important;
          }
          .yellow-accent {
            background-color: #fbbf24 !important;
          }
          .yellow-accent:hover {
            background-color: #f59e0b !important;
          }
          .responsive-container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: white !important;
            color: #111827 !important;
          }
          .responsive-header {
            padding: 20px;
          }
          .responsive-content {
            padding: 20px;
            background-color: white !important;
            color: #111827 !important;
          }
          .responsive-section {
            padding: 20px;
            margin: 15px 0;
            width: 100%;
            background-color: #f9fafb !important;
            color: #111827 !important;
          }
          .responsive-text {
            font-size: 14px;
          }
          .responsive-title {
            font-size: 18px;
          }
          .responsive-button {
            width: 100%;
            padding: 15px 30px;
            font-size: 14px;
            display: inline-block;
            margin: 0 auto;
            max-width: 300px;
            background-color: #fbbf24 !important;
            color: white !important;
          }
          .responsive-footer {
            padding: 20px;
            background-color: #1f2937 !important;
            color: white !important;
          }
          .full-width {
            width: 100% !important;
            max-width: none !important;
          }
          .no-margin {
            margin: 0 !important;
          }
          @media only screen and (min-width: 600px) {
            .responsive-container {
              margin: 40px auto;
            }
            .responsive-header {
              padding: 40px;
            }
            .responsive-content {
              padding: 40px;
              background-color: white !important;
              color: #111827 !important;
            }
            .responsive-section {
              padding: 30px;
              margin: 20px 0;
              background-color: #f9fafb !important;
              color: #111827 !important;
            }
            .responsive-text {
              font-size: 16px;
            }
            .responsive-title {
              font-size: 22px;
            }
            .responsive-button {
              width: auto;
              padding: 18px 40px;
              font-size: 16px;
              display: inline-block;
              max-width: none;
              background-color: #fbbf24 !important;
              color: white !important;
            }
            .responsive-footer {
              padding: 30px;
              background-color: #1f2937 !important;
              color: white !important;
            }
          }
        `}</style>
      </Head>
      <Preview>¡Gracias por tu compra en Flecha Extreme! Aquí tienes tu ticket de compra.</Preview>
      <Tailwind>
        <Body 
          className="bg-gray-50 font-sans my-auto mx-auto"
          style={{
            backgroundColor: '#f9fafb !important',
            color: '#111827 !important',
            margin: '0 !important',
            padding: '0 !important'
          }}
        >
          {/* Gmail Dark Mode Fix */}
          <div style={{
            display: 'none',
            fontSize: '1px',
            color: '#f9fafb',
            lineHeight: '1px',
            fontFamily: 'Arial, sans-serif',
            maxHeight: '0px',
            maxWidth: '0px',
            opacity: 0,
            overflow: 'hidden'
          }}>
            &nbsp;
          </div>
          <Container 
            className="responsive-container border border-solid border-gray-200 rounded-lg p-0 bg-white shadow-lg"
            style={{
              backgroundColor: 'white !important',
              color: '#111827 !important',
              maxWidth: '600px !important',
              margin: '20px auto !important'
            }}
          >
            
            {/* Header con gradiente azul */}
            <Section className="brand-gradient responsive-header text-center rounded-t-lg">
              <img 
                src="https://vvcpgnkatdwwzwnfihrf.supabase.co/storage/v1/object/public/logos/main-logo.png" 
                alt="Flecha Extreme" 
                className="max-w-[120px] h-auto mb-[15px] mx-auto"
                style={{maxWidth: '150px'}}
              />
              <Heading className="text-white responsive-title font-bold m-0 mb-[8px]">
                ¡Gracias por tu compra!
              </Heading>
              <Text className="text-blue-100 responsive-text m-0">
                Hola {cliente.nombre}, aquí tienes tu ticket de compra
              </Text>
            </Section>

            {/* Contenido principal */}
            <Section 
              className="responsive-content bg-white"
              style={{
                backgroundColor: 'white !important',
                color: '#111827 !important',
                padding: '20px !important'
              }}
            >
              
              {/* Resumen de compra con diseño mejorado */}
              <Section 
                className="bg-gray-50 responsive-section rounded-lg border-l-4 border-yellow-400 full-width"
                style={{
                  backgroundColor: '#f9fafb !important',
                  color: '#111827 !important',
                  padding: '20px !important',
                  margin: '15px 0 !important',
                  width: '100% !important'
                }}
              >
                <Heading className="text-gray-800 responsive-title font-bold mb-[15px] text-center">
                  <span className="yellow-accent text-white px-2 py-1 rounded-full text-[14px] mr-2">📄</span>
                  Resumen de tu compra
                </Heading>
                
                {/* Información del pedido */}
                <Section className="bg-white p-[15px] rounded-lg mb-[15px] border border-gray-200 full-width">
                  <Section className="flex justify-between mb-[10px] pb-[6px] border-b border-gray-200">
                    <Text className="m-0 text-gray-600 font-medium responsive-text">Fecha:</Text>
                    <Text className="m-0 text-gray-800 font-semibold responsive-text">{formatDate(ticketData.fecha)}</Text>
                  </Section>
                  <Section className="flex justify-between mb-0">
                    <Text className="m-0 text-gray-600 font-medium responsive-text">Método de pago:</Text>
                    <Text className="m-0 text-gray-800 font-semibold responsive-text">{ticketData.metodoPago}</Text>
                  </Section>
                </Section>
                
                {/* Productos */}
                <Section className="bg-white p-[15px] rounded-lg mb-[15px] border border-gray-200 full-width">
                  <Text className="text-gray-700 responsive-text font-semibold mb-[12px]">Productos:</Text>
                  {ticketData.cartItems.map((item, index) => (
                    <Section key={index} className="flex justify-between mb-[6px] text-[12px] py-[4px]">
                      <Text className="flex-1 m-0 text-gray-700">
                        {item.name}{item.quantity > 0 ? ` x${item.quantity}` : ''}
                      </Text>
                      <Text className="font-bold m-0 text-gray-800">
                        {formatPrice(item.id === 'producto-desconocido' ? item.price : item.price * item.quantity)}
                      </Text>
                    </Section>
                  ))}
                </Section>
                
                {/* Totales */}
                <Section className="bg-white p-[15px] rounded-lg border border-gray-200 full-width">
                  <Section className="flex justify-between mb-[8px] pb-[6px] border-b border-gray-200">
                    <Text className="m-0 text-gray-600 responsive-text">Subtotal:</Text>
                    <Text className="m-0 text-gray-800 responsive-text">{formatPrice(ticketData.subtotal)}</Text>
                  </Section>
                  <Section className="flex justify-between mb-[8px] pb-[6px] border-b border-gray-200">
                    <Text className="m-0 text-gray-600 responsive-text">IVA incluido (21%):</Text>
                    <Text className="m-0 text-gray-800 responsive-text">{formatPrice(ticketData.iva)}</Text>
                  </Section>
                  {ticketData.discountPercentage > 0 && (
                    <Section className="flex justify-between mb-[8px] pb-[6px] border-b border-gray-200">
                      <Text className="m-0 text-gray-600 responsive-text">Descuento ({ticketData.discountPercentage}%):</Text>
                      <Text className="m-0 text-red-600 responsive-text">-{formatPrice(ticketData.descuento)}</Text>
                    </Section>
                  )}
                  <Section className="flex justify-between mb-0 pt-[12px] border-t-2 border-yellow-400 font-bold text-[16px]">
                    <Text className="m-0 text-gray-800">TOTAL:</Text>
                    <Text className="m-0 text-blue-600">{formatPrice(ticketData.total)}</Text>
                  </Section>
                </Section>
              </Section>
              
              {/* Botón de descarga - Correctamente posicionado */}
              <Section className="text-center mt-[25px] mb-[15px] px-[20px]">
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <Button
                    className="yellow-accent text-white responsive-button rounded-lg font-bold no-underline text-center hover-bg-yellow-500 transition-colors shadow-lg"
                    href={ticketUrl}
                    style={{ 
                      backgroundColor: '#fbbf24',
                      color: 'white',
                      padding: '15px 30px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      display: 'inline-block',
                      maxWidth: '300px',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  >
                    📥 Descargar Ticket PDF
                  </Button>
                </div>
              </Section>
            </Section>
            
            {/* Footer */}
            <Section className="bg-gray-800 responsive-footer text-center rounded-b-lg">
              <Heading className="text-white responsive-title font-bold mb-[12px]">
                FLECHA EXTREME
              </Heading>
              <Text className="text-gray-300 responsive-text leading-[1.6] m-0">
                Urb. Portil Ca-C 1<br />
                21100 Nuevo Portil, Huelva<br />
                Tel. 617000546
              </Text>
              <Text className="text-gray-400 text-[11px] mt-[12px] m-0">
                ¡Gracias por confiar en nosotros! 🏄‍♂️
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
