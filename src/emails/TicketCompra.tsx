import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
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

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Html>
      <Head />
      <Preview>¡Gracias por tu compra en Flecha Extreme! Aquí tienes tu ticket de compra.</Preview>
      <Tailwind>
        <Body className="bg-slate-800 font-sans my-auto mx-auto">
          <Container className="border border-solid border-slate-600 rounded my-[40px] mx-auto p-[20px] w-[600px] bg-slate-800">
            
            <Section className="text-center mb-[30px]">
              <img 
                src="https://flechaextreme.com/cropped-lgo.png" 
                alt="Flecha Extreme" 
                className="max-w-[120px] h-auto mb-[20px] rounded-lg mx-auto"
              />
              <Heading className="text-white text-[28px] font-bold m-0">
                ¡Gracias por comprar en Flecha Extreme, {cliente.nombre}!
              </Heading>
            </Section>

            <Section className="bg-slate-700 p-[30px] rounded-lg mb-[30px]">
              <Text className="text-white text-[18px] mb-[20px]">
                ¡Hola {cliente.nombre}!
              </Text>
              
              <Text className="text-slate-200 text-[16px] leading-[1.6] mb-[30px]">
                Aquí tienes tu ticket de compra, ¡vuelve pronto!
              </Text>
              
              <Section className="bg-slate-800 p-[20px] rounded-lg my-[20px] border-2 border-slate-500">
                <Heading className="text-white text-[20px] font-bold mb-[15px] text-center">
                  📄 Resumen de tu compra
                </Heading>
                
                <Section className="text-slate-200 text-[14px]">
                  <Section className="flex justify-between mb-[8px] pb-[5px] border-b border-slate-500">
                    <Text className="m-0">Fecha:</Text>
                    <Text className="m-0">{formatDate(ticketData.fecha)}</Text>
                  </Section>
                  <Section className="flex justify-between mb-[8px] pb-[5px] border-b border-slate-500">
                    <Text className="m-0">Método de pago:</Text>
                    <Text className="m-0">{ticketData.metodoPago}</Text>
                  </Section>
                </Section>
                
                <Section className="my-[15px]">
                  {ticketData.cartItems.map((item, index) => (
                    <Section key={index} className="flex justify-between mb-[5px] text-[14px]">
                      <Text className="flex-1 m-0 text-slate-200">
                        {item.name}{item.quantity > 0 ? ` x${item.quantity}` : ''}
                      </Text>
                      <Text className="font-bold m-0 text-white">
                        {formatPrice(item.id === 'producto-desconocido' ? item.price : item.price * item.quantity)}
                      </Text>
                    </Section>
                  ))}
                </Section>
                
                <Section className="text-slate-200 text-[14px]">
                  <Section className="flex justify-between mb-[8px] pb-[5px] border-b border-slate-500">
                    <Text className="m-0">Subtotal:</Text>
                    <Text className="m-0">{formatPrice(ticketData.subtotal)}</Text>
                  </Section>
                  <Section className="flex justify-between mb-[8px] pb-[5px] border-b border-slate-500">
                    <Text className="m-0">IVA incluido (21%):</Text>
                    <Text className="m-0">{formatPrice(ticketData.iva)}</Text>
                  </Section>
                  {ticketData.discountPercentage > 0 && (
                    <Section className="flex justify-between mb-[8px] pb-[5px] border-b border-slate-500">
                      <Text className="m-0">Descuento ({ticketData.discountPercentage}%):</Text>
                      <Text className="m-0">-{formatPrice(ticketData.descuento)}</Text>
                    </Section>
                  )}
                  <Section className="flex justify-between mb-0 pt-[10px] border-t-2 border-slate-500 font-bold text-[16px] text-white">
                    <Text className="m-0">TOTAL:</Text>
                    <Text className="m-0">{formatPrice(ticketData.total)}</Text>
                  </Section>
                </Section>
              </Section>
              
              <Section className="text-center">
                <Button
                  className="bg-blue-600 text-white px-[30px] py-[15px] rounded-lg font-bold text-[16px] no-underline text-center hover:bg-blue-700 transition-colors"
                  href={ticketUrl}
                >
                  📥 Descargar Ticket PDF
                </Button>
              </Section>
            </Section>
            
            <Section className="text-center mt-[30px] pt-[20px] border-t-2 border-slate-500">
              <Heading className="text-white text-[18px] font-bold mb-[10px]">
                FLECHA EXTREME
              </Heading>
              <Text className="text-slate-200 text-[14px] leading-[1.5] m-0">
                Urb. Portil Ca-C 1<br />
                21100 Nuevo Portil, Huelva<br />
                Tel. 617000546
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
