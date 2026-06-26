import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { Cliente, TicketData } from '../lib/emailTemplates';

interface TicketCompraProps {
  cliente: Cliente;
  ticketData: TicketData;
  ticketUrl: string;
}

const colors = {
  background: '#faf8ff',
  surface: '#ffffff',
  surfaceMuted: '#f2f3ff',
  primaryDark: '#00296b',
  primary: '#003f88',
  primaryLight: '#00509d',
  accent: '#fdc500',
  accentLight: '#ffd500',
  text: '#001947',
  textMuted: '#434751',
  border: '#c3c6d3',
  borderSoft: '#e0e5f4',
  footerText: '#dbe7ff',
};

const fontSans = 'Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const fontHeadline = 'Manrope, Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const logoUrl = 'https://vvcpgnkatdwwzwnfihrf.supabase.co/storage/v1/object/public/logos/main-logo.png';

export default function TicketCompra({
  cliente,
  ticketData,
  ticketUrl,
}: TicketCompraProps) {
  const formatPrice = (price: number): string => `${price.toFixed(2).replace('.', ',')}€`;

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasDiscount = ticketData.descuento > 0;
  const discountLabel = ticketData.discountLabel
    ?? (ticketData.discountPercentage > 0 ? `Descuento (${ticketData.discountPercentage}%)` : 'Descuento');
  const previewText = `Tu ticket de compra en Flecha Extreme ya está listo, ${cliente.nombre}.`;

  return (
    <Html lang="es">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
        <style>{`
          :root {
            color-scheme: light only !important;
            supported-color-schemes: light only !important;
          }
          body, html {
            margin: 0;
            padding: 0;
            background: ${colors.background} !important;
            color: ${colors.text} !important;
          }
          * {
            color-scheme: light only !important;
          }
          [data-ogsc] body,
          [data-ogsc] .email-bg {
            background: ${colors.background} !important;
            color: ${colors.text} !important;
          }
          [data-ogsc] .email-card,
          [data-ogsc] .email-panel {
            background: ${colors.surface} !important;
            color: ${colors.text} !important;
          }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body
        className="email-bg"
        style={{
          margin: '0',
          padding: '24px 12px',
          backgroundColor: colors.background,
          color: colors.text,
          fontFamily: fontSans,
        }}
      >
        <Container
          className="email-card"
          style={{
            maxWidth: '600px',
            width: '100%',
            margin: '0 auto',
            backgroundColor: colors.surface,
            border: `1px solid ${colors.borderSoft}`,
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 25, 71, 0.08)',
          }}
        >
          <Section
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              padding: '32px 32px 28px',
              textAlign: 'center',
            }}
          >
            <Section
              style={{
                display: 'inline-block',
                backgroundColor: colors.surface,
                borderRadius: '999px',
                padding: '12px 18px',
                marginBottom: '20px',
                boxShadow: '0 10px 24px rgba(0, 25, 71, 0.16)',
              }}
            >
              <Img
                src={logoUrl}
                alt="Flecha Extreme"
                width="140"
                style={{
                  display: 'block',
                  width: '140px',
                  maxWidth: '100%',
                  height: 'auto',
                  margin: '0 auto',
                }}
              />
            </Section>

            <Text
              style={{
                margin: '0 0 10px',
                color: colors.accentLight,
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              Ticket de compra
            </Text>
            <Heading
              as="h1"
              style={{
                margin: '0 0 12px',
                color: '#ffffff',
                fontFamily: fontHeadline,
                fontSize: '30px',
                lineHeight: '36px',
                fontWeight: 800,
              }}
            >
              Gracias por tu compra, {cliente.nombre}
            </Heading>
            <Text
              style={{
                maxWidth: '420px',
                margin: '0 auto',
                color: '#dbe7ff',
                fontSize: '15px',
                lineHeight: '24px',
              }}
            >
              Te enviamos el resumen del pago y el acceso directo para descargar tu ticket siempre que lo necesites.
            </Text>
          </Section>

          <Section style={{ padding: '32px 24px 16px' }}>
            <Section
              className="email-panel"
              style={{
                backgroundColor: colors.surfaceMuted,
                border: `1px solid ${colors.borderSoft}`,
                borderRadius: '24px',
                padding: '24px',
              }}
            >
              <Text
                style={{
                  margin: '0 0 18px',
                  color: colors.primaryDark,
                  fontFamily: fontHeadline,
                  fontSize: '22px',
                  lineHeight: '28px',
                  fontWeight: 800,
                }}
              >
                Resumen de la compra
              </Text>

              <Section
                className="email-panel"
                style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: '18px',
                  padding: '18px 18px 6px',
                  marginBottom: '16px',
                }}
              >
                <Row>
                  <Column>
                    <Text
                      style={{
                        margin: '0 0 6px',
                        color: colors.textMuted,
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Fecha
                    </Text>
                    <Text
                      style={{
                        margin: '0 0 12px',
                        color: colors.text,
                        fontSize: '14px',
                        lineHeight: '22px',
                        fontWeight: 600,
                      }}
                    >
                      {formatDate(ticketData.fecha)}
                    </Text>
                  </Column>
                  <Column>
                    <Text
                      style={{
                        margin: '0 0 6px',
                        color: colors.textMuted,
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Método de pago
                    </Text>
                    <Text
                      style={{
                        margin: '0 0 12px',
                        color: colors.text,
                        fontSize: '14px',
                        lineHeight: '22px',
                        fontWeight: 600,
                      }}
                    >
                      {ticketData.metodoPago}
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section
                className="email-panel"
                style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: '18px',
                  padding: '18px',
                  marginBottom: '16px',
                }}
              >
                <Text
                  style={{
                    margin: '0 0 14px',
                    color: colors.textMuted,
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Artículos
                </Text>

                {ticketData.cartItems.map((item, index) => {
                  const itemTotal = item.id === 'producto-desconocido' ? item.price : item.price * item.quantity;
                  const quantitySuffix = item.quantity > 0 ? ` x${item.quantity}` : '';

                  return (
                    <Section key={`${item.id}-${index}`}>
                      <Row>
                        <Column style={{ padding: '0 12px 12px 0' }}>
                          <Text
                            style={{
                              margin: '0',
                              color: colors.text,
                              fontSize: '14px',
                              lineHeight: '22px',
                              fontWeight: 600,
                            }}
                          >
                            {item.name}{quantitySuffix}
                          </Text>
                        </Column>
                        <Column align="right" style={{ width: '112px', paddingBottom: '12px' }}>
                          <Text
                            style={{
                              margin: '0',
                              color: colors.primaryDark,
                              fontSize: '14px',
                              lineHeight: '22px',
                              fontWeight: 800,
                              textAlign: 'right',
                            }}
                          >
                            {formatPrice(itemTotal)}
                          </Text>
                        </Column>
                      </Row>
                      {index < ticketData.cartItems.length - 1 ? (
                        <Hr
                          style={{
                            margin: '0 0 12px',
                            border: 'none',
                            borderTop: `1px solid ${colors.borderSoft}`,
                          }}
                        />
                      ) : null}
                    </Section>
                  );
                })}
              </Section>

              <Section
                className="email-panel"
                style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: '18px',
                  padding: '18px',
                }}
              >
                <Text
                  style={{
                    margin: '0 0 14px',
                    color: colors.textMuted,
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Totales
                </Text>

                <Row style={{ marginBottom: '10px' }}>
                  <Column>
                    <Text style={{ margin: '0', color: colors.textMuted, fontSize: '14px', lineHeight: '22px' }}>
                      Subtotal
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text style={{ margin: '0', color: colors.text, fontSize: '14px', lineHeight: '22px', fontWeight: 600, textAlign: 'right' }}>
                      {formatPrice(ticketData.subtotal)}
                    </Text>
                  </Column>
                </Row>

                <Row style={{ marginBottom: hasDiscount ? '10px' : '0' }}>
                  <Column>
                    <Text style={{ margin: '0', color: colors.textMuted, fontSize: '14px', lineHeight: '22px' }}>
                      IVA incluido (21%)
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text style={{ margin: '0', color: colors.text, fontSize: '14px', lineHeight: '22px', fontWeight: 600, textAlign: 'right' }}>
                      {formatPrice(ticketData.iva)}
                    </Text>
                  </Column>
                </Row>

                {hasDiscount ? (
                  <Row style={{ marginBottom: '0' }}>
                    <Column>
                      <Text style={{ margin: '0', color: colors.textMuted, fontSize: '14px', lineHeight: '22px' }}>
                        {discountLabel}
                      </Text>
                    </Column>
                    <Column align="right">
                      <Text style={{ margin: '0', color: colors.primary, fontSize: '14px', lineHeight: '22px', fontWeight: 700, textAlign: 'right' }}>
                        -{formatPrice(ticketData.descuento)}
                      </Text>
                    </Column>
                  </Row>
                ) : null}

                <Hr
                  style={{
                    margin: '18px 0 16px',
                    border: 'none',
                    borderTop: `1px solid ${colors.border}`,
                  }}
                />

                <Section
                  style={{
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: '16px',
                    padding: '14px 16px',
                  }}
                >
                  <Row>
                    <Column>
                      <Text
                        style={{
                          margin: '0',
                          color: colors.primaryDark,
                          fontFamily: fontHeadline,
                          fontSize: '13px',
                          lineHeight: '20px',
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Total
                      </Text>
                    </Column>
                    <Column align="right">
                      <Text
                        style={{
                          margin: '0',
                          color: colors.primaryDark,
                          fontFamily: fontHeadline,
                          fontSize: '24px',
                          lineHeight: '28px',
                          fontWeight: 800,
                          textAlign: 'right',
                        }}
                      >
                        {formatPrice(ticketData.total)}
                      </Text>
                    </Column>
                  </Row>
                </Section>
              </Section>
            </Section>
          </Section>

          <Section style={{ padding: '0 24px 28px', textAlign: 'center' }}>
            <Text
              style={{
                margin: '0 0 16px',
                color: colors.textMuted,
                fontSize: '14px',
                lineHeight: '22px',
              }}
            >
              Puedes descargar tu ticket completo en PDF desde el siguiente botón.
            </Text>
            <Button
              href={ticketUrl}
              style={{
                display: 'inline-block',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: '#ffffff',
                borderRadius: '999px',
                padding: '16px 28px',
                fontFamily: fontSans,
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 12px 24px rgba(0, 63, 136, 0.22)',
              }}
            >
              Descargar ticket
            </Button>
          </Section>

          <Section
            style={{
              backgroundColor: colors.primaryDark,
              padding: '24px 24px 28px',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                margin: '0 0 10px',
                color: '#ffffff',
                fontFamily: fontHeadline,
                fontSize: '18px',
                lineHeight: '24px',
                fontWeight: 800,
              }}
            >
              Flecha Extreme
            </Text>
            <Text
              style={{
                margin: '0',
                color: colors.footerText,
                fontSize: '13px',
                lineHeight: '22px',
              }}
            >
              Urb. Portil Ca-C 1
              <br />
              21100 Nuevo Portil, Huelva
              <br />
              Tel. 617000546
            </Text>
            <Text
              style={{
                margin: '16px 0 0',
                color: colors.accentLight,
                fontSize: '12px',
                lineHeight: '18px',
                fontWeight: 700,
              }}
            >
              Gracias por confiar en nosotros.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
