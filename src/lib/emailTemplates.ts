export interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
}

export interface TicketData {
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

export function generatePurchaseEmailHTML(cliente: Cliente, ticketData: TicketData, ticketUrl: string): string {
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

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gracias por tu compra - Flecha Extreme</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background-color: #1e293b;
            color: #ffffff;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #1e293b;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            margin: 20px 0;
            text-align: center;
        }
        .content {
            background-color: #334155;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #ffffff;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #e2e8f0;
        }
        .ticket-info {
            background-color: #1e293b;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 2px solid #475569;
        }
        .ticket-title {
            font-size: 20px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 15px;
            text-align: center;
        }
        .ticket-details {
            font-size: 14px;
            color: #e2e8f0;
        }
        .ticket-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #475569;
        }
        .ticket-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 16px;
            color: #ffffff;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #475569;
        }
        .download-button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: background-color 0.3s;
        }
        .download-button:hover {
            background-color: #2563eb;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #475569;
        }
        .company-info {
            font-size: 14px;
            color: #e2e8f0;
            line-height: 1.5;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 10px;
        }
        .products-list {
            margin: 15px 0;
        }
        .product-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 14px;
        }
        .product-name {
            flex: 1;
        }
        .product-price {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://flechaextreme.com/cropped-lgo.png" alt="Flecha Extreme" class="logo">
            <div class="title">¡Gracias por comprar en Flecha Extreme, ${cliente.nombre}!</div>
        </div>
        
        <div class="content">
            <div class="greeting">¡Hola ${cliente.nombre}!</div>
            
            <div class="message">
                Aquí tienes tu ticket de compra, ¡vuelve pronto!
            </div>
            
            <div class="ticket-info">
                <div class="ticket-title">📄 Resumen de tu compra</div>
                
                <div class="ticket-details">
                    <div class="ticket-row">
                        <span>Fecha:</span>
                        <span>${formatDate(ticketData.fecha)}</span>
                    </div>
                    <div class="ticket-row">
                        <span>Método de pago:</span>
                        <span>${ticketData.metodoPago}</span>
                    </div>
                </div>
                
                <div class="products-list">
                    ${ticketData.cartItems.map(item => `
                        <div class="product-item">
                            <span class="product-name">${item.name}${item.quantity > 0 ? ` x${item.quantity}` : ''}</span>
                            <span class="product-price">${formatPrice(item.id === 'producto-desconocido' ? item.price : item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="ticket-details">
                    <div class="ticket-row">
                        <span>Subtotal:</span>
                        <span>${formatPrice(ticketData.subtotal)}</span>
                    </div>
                    <div class="ticket-row">
                        <span>IVA incluido (21%):</span>
                        <span>${formatPrice(ticketData.iva)}</span>
                    </div>
                    ${ticketData.discountPercentage > 0 ? `
                    <div class="ticket-row">
                        <span>Descuento (${ticketData.discountPercentage}%):</span>
                        <span>-${formatPrice(ticketData.descuento)}</span>
                    </div>
                    ` : ''}
                    <div class="ticket-row">
                        <span>TOTAL:</span>
                        <span>${formatPrice(ticketData.total)}</span>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${ticketUrl}" class="download-button" target="_blank">
                    📥 Descargar Ticket PDF
                </a>
            </div>
        </div>
        
        <div class="footer">
            <div class="company-name">FLECHA EXTREME</div>
            <div class="company-info">
                Urb. Portil Ca-C 1<br>
                21100 Nuevo Portil, Huelva<br>
                Tel. 617000546
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

export function generatePurchaseEmailText(cliente: Cliente, ticketData: TicketData, ticketUrl: string): string {
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

  return `
¡Gracias por comprar en Flecha Extreme, ${cliente.nombre}!

¡Hola ${cliente.nombre}!

Aquí tienes tu ticket de compra, ¡vuelve pronto!

RESUMEN DE TU COMPRA
====================

Fecha: ${formatDate(ticketData.fecha)}
Método de pago: ${ticketData.metodoPago}

PRODUCTOS:
${ticketData.cartItems.map(item => 
  `${item.name}${item.quantity > 0 ? ` x${item.quantity}` : ''} - ${formatPrice(item.id === 'producto-desconocido' ? item.price : item.price * item.quantity)}`
).join('\n')}

TOTALES:
Subtotal: ${formatPrice(ticketData.subtotal)}
IVA incluido (21%): ${formatPrice(ticketData.iva)}
${ticketData.discountPercentage > 0 ? `Descuento (${ticketData.discountPercentage}%): -${formatPrice(ticketData.descuento)}` : ''}
TOTAL: ${formatPrice(ticketData.total)}

Descargar ticket PDF: ${ticketUrl}

---
FLECHA EXTREME
Urb. Portil Ca-C 1
21100 Nuevo Portil, Huelva
Tel. 617000546
  `;
}
