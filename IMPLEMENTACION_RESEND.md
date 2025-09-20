# 📧 Implementación de Resend en Flecha Extreme

## 🏗️ Arquitectura General

El proyecto utiliza **Resend** como servicio de emails transaccionales, integrado con **React Email** para crear plantillas de correo elegantes y **Next.js API Routes** para el envío.

## 📦 Dependencias Instaladas

```json
{
  "dependencies": {
    "resend": "^6.1.0",
    "@react-email/components": "^0.5.3",
    "@react-email/tailwind": "^1.2.2"
  }
}
```

## 🔧 Configuración Base

### 1. Archivo de Configuración Principal (`src/lib/resend.ts`)

```typescript
import { Resend } from 'resend';

// Verificar si estamos en modo de desarrollo y usar mock en ese caso
const isDevelopment = process.env.NODE_ENV === 'development';
const resendApiKey = process.env.RESEND_API_KEY || '';

let resend;

if (isDevelopment && !resendApiKey) {
  console.warn('Resend: Usando modo mock para desarrollo local');
  // Crear un mock básico de Resend para desarrollo
  resend = {
    emails: {
      send: async () => ({ data: { id: 'mock-email-id' }, error: null }),
    },
  };
} else {
  resend = new Resend(resendApiKey);
}

export default resend;
```

**Características clave:**
- ✅ **Modo desarrollo inteligente**: Si no hay API key en desarrollo, usa un mock
- ✅ **Inicialización condicional**: Solo crea instancia real si hay API key
- ✅ **Logging**: Avisa cuando está en modo mock
- ✅ **Exportación única**: Una sola instancia para todo el proyecto

### 2. Variables de Entorno

```env
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Para links en emails
```

## 📧 Plantillas de Email con React Email

### Estructura de Plantilla (`src/emails/TicketCompra.tsx`)

La plantilla utiliza React Email con Tailwind CSS para crear emails responsivos y profesionales:

```typescript
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
  // ... implementación de la plantilla
}
```

**Características de la plantilla:**
- ✅ **TypeScript**: Tipado completo de props
- ✅ **Tailwind CSS**: Estilos modernos y responsivos
- ✅ **Preview**: Texto de vista previa para clientes de email
- ✅ **Componentes React Email**: Optimizados para compatibilidad
- ✅ **Datos dinámicos**: Props para personalizar contenido
- ✅ **Diseño profesional**: Estructura clara y atractiva

## 🚀 API Route para Envío de Emails

### Endpoint (`src/app/api/send-email/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '../../../lib/emailService';
import { TicketCompra } from '../../../emails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, type, data } = body;

    // Si es un email de tipo ticket de compra, usar la plantilla React
    if (type === 'ticket-compra' && data) {
      const { cliente, ticketData, ticketUrl } = data;
      
      emailOptions.react = TicketCompra({
        cliente,
        ticketData,
        ticketUrl,
      });
    } else {
      // Para emails tradicionales con HTML/texto
      if (html) emailOptions.html = html;
      if (text) emailOptions.text = text;
    }

    const result = await sendEmail(emailOptions);
    // ... manejo de respuesta
  } catch (error) {
    // ... manejo de errores
  }
}
```

## 🎯 Uso desde el Frontend

### Hook `useEmailAPI`

```typescript
import { useEmailAPI } from '@/hooks/useEmailAPI';

function MiComponente() {
  const { sendEmail, sendTicketEmail, loading, error } = useEmailAPI();

  // Enviar email de ticket de compra
  const handleSendTicket = async () => {
    const result = await sendTicketEmail(cliente, ticketData, ticketUrl);
    if (result.success) {
      console.log('Email enviado exitosamente');
    }
  };

  // Enviar email personalizado
  const handleSendCustomEmail = async () => {
    const result = await sendEmail({
      to: 'cliente@email.com',
      subject: 'Asunto del email',
      html: '<h1>Contenido HTML</h1>',
      text: 'Contenido en texto plano'
    });
  };
}
```

### Hook `useTickets` (Actualizado)

El hook `useTickets` ahora usa automáticamente la nueva plantilla React Email:

```typescript
import { useTickets } from '@/hooks/useTickets';

function MiComponente() {
  const { saveTicket, generateTicketQR, loading, error } = useTickets();

  const handleGenerateTicket = async () => {
    const ticketData = {
      cartItems: [...],
      subtotal: 100,
      iva: 21,
      total: 121,
      metodoPago: 'Efectivo',
      fecha: new Date(),
      clienteId: 'cliente-id' // Importante: incluir el ID del cliente
    };

    const result = await generateTicketQR(ticketData);
    if (result.success) {
      console.log('Ticket generado y email enviado');
    }
  };
}
```

## 📋 Detalles de Configuración

### 1. **Remitente (From)**
```typescript
from: 'Flecha Extreme <noreply@flechaextreme.com>'
```
- ✅ **Nombre personalizado**: "Flecha Extreme" 
- ✅ **Email verificado**: `noreply@flechaextreme.com`
- ✅ **Formato estándar**: `Nombre <email@dominio.com>`

### 2. **Asunto (Subject)**
```typescript
subject: '¡Gracias por tu compra en Flecha Extreme!'
```
- ✅ **Personalizado**: Incluye nombre de la empresa
- ✅ **Acción clara**: Mensaje de agradecimiento
- ✅ **Emoji opcional**: Para mayor engagement

## 🔄 Flujo Completo de Envío

### 1. **Generación de Ticket**
```typescript
const result = await generateTicketQR({
  cartItems: [...],
  subtotal: 100,
  iva: 21,
  total: 121,
  metodoPago: 'Efectivo',
  fecha: new Date(),
  clienteId: 'cliente-id'
});
```

### 2. **Envío Automático del Email**
- Se obtiene la información del cliente desde Supabase
- Se genera la plantilla React Email con los datos del ticket
- Se envía el email usando Resend
- Se maneja cualquier error de forma elegante

### 3. **Manejo de Errores**
```typescript
if (result.success) {
  console.log('Email enviado exitosamente');
} else {
  console.error('Error:', result.error);
}
```

## 🎯 Mejores Prácticas Implementadas

### 1. **Manejo de Errores Robusto**
- ✅ Validación de entrada
- ✅ Try-catch específicos
- ✅ Logs detallados
- ✅ Respuestas HTTP apropiadas

### 2. **Modo Desarrollo**
- ✅ Mock automático sin API key
- ✅ Logs informativos
- ✅ No falla en desarrollo

### 3. **Seguridad**
- ✅ API key en variables de entorno
- ✅ Validación de datos de entrada
- ✅ No exposición de credenciales

### 4. **Escalabilidad**
- ✅ Configuración centralizada
- ✅ Plantillas reutilizables
- ✅ Estructura modular

### 5. **UX/UI**
- ✅ Emails responsivos
- ✅ Diseño profesional
- ✅ Contenido claro y accionable

## 📊 Estructura de Archivos

```
src/
├── lib/
│   ├── resend.ts              # Configuración base de Resend
│   ├── emailService.ts        # Servicio de envío de emails
│   └── emailTemplates.ts      # Interfaces y funciones auxiliares
├── emails/
│   ├── TicketCompra.tsx       # Plantilla de ticket de compra
│   └── index.ts               # Exportaciones
├── hooks/
│   ├── useEmailAPI.ts         # Hook para envío de emails
│   └── useTickets.ts          # Hook para tickets (actualizado)
└── app/api/
    └── send-email/
        └── route.ts           # Endpoint de envío
```

## 🚨 Troubleshooting Común

### 1. **Email no llega**
- Verificar dominio configurado en Resend
- Comprobar carpeta de spam
- Validar API key

### 2. **Error de autenticación**
- Verificar `RESEND_API_KEY` en variables de entorno
- Comprobar que la key sea válida

### 3. **Plantilla no se renderiza**
- Verificar imports de React Email
- Comprobar sintaxis JSX
- Validar props pasadas

### 4. **Error en desarrollo**
- El sistema usa automáticamente un mock si no hay API key
- Verificar que no hay errores de sintaxis en las plantillas

## 🔄 Migración desde la Implementación Anterior

La nueva implementación es **completamente compatible** con el código existente:

1. **No se requieren cambios** en los componentes que usan `useTickets`
2. **Los emails se envían automáticamente** con la nueva plantilla React Email
3. **Se mantiene la funcionalidad** de generación de PDFs y QR codes
4. **Se mejora la apariencia** de los emails sin afectar la funcionalidad

## 📈 Beneficios de la Nueva Implementación

1. **Emails más atractivos**: Diseño profesional con React Email
2. **Mejor compatibilidad**: Optimizado para todos los clientes de email
3. **Desarrollo más fácil**: Modo mock automático en desarrollo
4. **Mantenimiento simplificado**: Plantillas reutilizables y tipadas
5. **Escalabilidad**: Fácil agregar nuevos tipos de email

Esta implementación es robusta, escalable y sigue las mejores prácticas para el envío de emails transaccionales en aplicaciones Next.js.
