# 🚀 Ejemplo de Uso de la Nueva Implementación de Resend

## 📧 Envío de Email de Ticket de Compra

### 1. Uso Básico con `useTickets`

```typescript
import { useTickets } from '@/hooks/useTickets';

function ComponenteVenta() {
  const { generateTicketQR, loading, error } = useTickets();

  const handleFinalizarVenta = async () => {
    const ticketData = {
      cartItems: [
        {
          id: 'producto-1',
          name: 'Café Americano',
          price: 2.50,
          quantity: 2,
          image: '/cafe-americano.jpg'
        },
        {
          id: 'producto-2',
          name: 'Croissant',
          price: 1.80,
          quantity: 1,
          image: '/croissant.jpg'
        }
      ],
      subtotal: 6.80,
      descuento: 0,
      discountPercentage: 0,
      iva: 1.43,
      total: 8.23,
      metodoPago: 'Efectivo',
      fecha: new Date(),
      pedidoId: 'pedido-123',
      clienteId: 'cliente-456' // ¡IMPORTANTE! Incluir el ID del cliente
    };

    try {
      const result = await generateTicketQR(ticketData);
      
      if (result.success) {
        console.log('✅ Ticket generado exitosamente');
        console.log('📄 URL del PDF:', result.url);
        console.log('📱 QR Code:', result.qrCode);
        console.log('📧 Email enviado al cliente');
      } else {
        console.error('❌ Error:', result.error);
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
    }
  };

  return (
    <div>
      <button 
        onClick={handleFinalizarVenta}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Procesando...' : 'Finalizar Venta'}
      </button>
      
      {error && (
        <div className="text-red-600 mt-2">
          Error: {error}
        </div>
      )}
    </div>
  );
}
```

### 2. Uso Directo con `useEmailAPI`

```typescript
import { useEmailAPI } from '@/hooks/useEmailAPI';
import { Cliente, TicketData } from '@/lib/emailTemplates';

function ComponenteEmailPersonalizado() {
  const { sendTicketEmail, sendEmail, loading, error } = useEmailAPI();

  const handleEnviarTicket = async () => {
    const cliente: Cliente = {
      id: 'cliente-123',
      nombre: 'Juan',
      apellidos: 'Pérez García',
      email: 'juan.perez@email.com'
    };

    const ticketData: TicketData = {
      cartItems: [
        {
          id: 'producto-1',
          name: 'Hamburguesa Clásica',
          price: 8.50,
          quantity: 1,
          image: '/hamburguesa.jpg'
        }
      ],
      subtotal: 8.50,
      descuento: 0,
      discountPercentage: 0,
      iva: 1.79,
      total: 10.29,
      metodoPago: 'Tarjeta',
      fecha: new Date(),
      pedidoId: 'pedido-789'
    };

    const ticketUrl = 'https://tu-dominio.com/tickets/ticket_789_1234567890.pdf';

    try {
      // Enviar email de ticket usando la plantilla React Email
      const result = await sendTicketEmail(cliente, ticketData, ticketUrl);
      
      if (result.success) {
        console.log('✅ Email de ticket enviado exitosamente');
      } else {
        console.error('❌ Error enviando email:', result.error);
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
    }
  };

  const handleEnviarEmailPersonalizado = async () => {
    try {
      // Enviar email personalizado con HTML
      const result = await sendEmail({
        to: 'cliente@email.com',
        subject: '¡Bienvenido a Flecha Extreme!',
        html: `
          <h1>¡Hola!</h1>
          <p>Gracias por registrarte en Flecha Extreme.</p>
          <p>¡Esperamos verte pronto!</p>
        `,
        text: '¡Hola! Gracias por registrarte en Flecha Extreme. ¡Esperamos verte pronto!'
      });
      
      if (result.success) {
        console.log('✅ Email personalizado enviado exitosamente');
      } else {
        console.error('❌ Error enviando email:', result.error);
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
    }
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={handleEnviarTicket}
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded mr-2"
      >
        {loading ? 'Enviando...' : 'Enviar Ticket'}
      </button>
      
      <button 
        onClick={handleEnviarEmailPersonalizado}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? 'Enviando...' : 'Enviar Email Personalizado'}
      </button>
      
      {error && (
        <div className="text-red-600 mt-2">
          Error: {error}
        </div>
      )}
    </div>
  );
}
```

## 🔧 Configuración de Variables de Entorno

### `.env.local`

```env
# Resend API Key (obtener de https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL base de tu aplicación
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase (ya configurado)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
```

## 📋 Flujo Completo de una Venta

```typescript
import { useTickets } from '@/hooks/useTickets';
import { usePedidos } from '@/hooks/usePedidos';

function ProcesoVenta() {
  const { generateTicketQR } = useTickets();
  const { createPedido } = usePedidos();

  const handleProcesarVenta = async (carrito, clienteId, metodoPago) => {
    try {
      // 1. Crear el pedido en la base de datos
      const pedido = await createPedido({
        cliente_id: clienteId,
        items: carrito.items,
        total: carrito.total,
        metodo_pago: metodoPago
      });

      // 2. Generar ticket PDF y enviar email automáticamente
      const ticketResult = await generateTicketQR({
        cartItems: carrito.items,
        subtotal: carrito.subtotal,
        descuento: carrito.descuento,
        discountPercentage: carrito.discountPercentage,
        iva: carrito.iva,
        total: carrito.total,
        metodoPago: metodoPago,
        fecha: new Date(),
        pedidoId: pedido.id,
        clienteId: clienteId // ¡IMPORTANTE!
      });

      if (ticketResult.success) {
        // 3. Mostrar confirmación al usuario
        console.log('✅ Venta procesada exitosamente');
        console.log('📧 Email enviado al cliente');
        console.log('📄 Ticket disponible en:', ticketResult.url);
        
        // 4. Limpiar carrito y redirigir
        // ... lógica de limpieza
      } else {
        throw new Error(ticketResult.error);
      }
    } catch (error) {
      console.error('❌ Error procesando venta:', error);
      // Mostrar error al usuario
    }
  };

  return (
    // ... JSX del componente
  );
}
```

## 🎯 Casos de Uso Comunes

### 1. **Venta con Cliente Registrado**
```typescript
// El cliente ya existe en la base de datos
const ticketData = {
  // ... datos del ticket
  clienteId: 'cliente-existente-123' // ID del cliente en Supabase
};

const result = await generateTicketQR(ticketData);
// ✅ Email se envía automáticamente al email del cliente
```

### 2. **Venta sin Cliente Registrado**
```typescript
// El cliente no está registrado, no se envía email
const ticketData = {
  // ... datos del ticket
  // Sin clienteId
};

const result = await generateTicketQR(ticketData);
// ✅ Ticket se genera, pero no se envía email
```

### 3. **Cliente sin Email Configurado**
```typescript
// El cliente existe pero no tiene email
const ticketData = {
  // ... datos del ticket
  clienteId: 'cliente-sin-email-456'
};

const result = await generateTicketQR(ticketData);
// ✅ Ticket se genera, se registra en logs que no se envió email
```

## 🚨 Manejo de Errores

```typescript
const { generateTicketQR, error } = useTickets();

const handleVenta = async () => {
  try {
    const result = await generateTicketQR(ticketData);
    
    if (result.success) {
      // ✅ Éxito
      toast.success('Venta procesada y email enviado');
    } else {
      // ❌ Error específico
      toast.error(`Error: ${result.error}`);
    }
  } catch (err) {
    // ❌ Error inesperado
    toast.error('Error inesperado al procesar la venta');
    console.error(err);
  }
};

// Mostrar error global si existe
{error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    Error: {error}
  </div>
)}
```

## 📊 Monitoreo y Logs

La implementación incluye logs detallados para monitoreo:

```typescript
// En la consola del servidor verás:
console.log('Email enviado exitosamente al cliente:', cliente.email);
console.log('Ticket generado exitosamente');
console.log('PDF guardado en:', publicUrl);

// En caso de error:
console.error('Error enviando email:', error);
console.warn('El cliente no tiene email configurado');
```

## 🔄 Compatibilidad con Código Existente

La nueva implementación es **100% compatible** con el código existente:

```typescript
// ✅ Este código sigue funcionando igual
const { generateTicketQR } = useTickets();

const result = await generateTicketQR({
  cartItems: [...],
  subtotal: 100,
  iva: 21,
  total: 121,
  metodoPago: 'Efectivo',
  fecha: new Date(),
  clienteId: 'cliente-id' // Solo necesitas agregar esto
});

// ✅ La diferencia es que ahora el email se ve mucho mejor
// ✅ Y es más compatible con todos los clientes de email
```

¡La nueva implementación está lista para usar! 🎉
