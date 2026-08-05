import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { ReactElement } from 'react';
import { TicketCompra } from '../../../emails';
import { sendEmail } from '../../../lib/emailService';
import type { Cliente, TicketData } from '../../../lib/emailTemplates';

const TICKET_SUBJECT = '¡Gracias por tu compra en Flecha Extreme!';
const MAX_EMAILS_PER_WINDOW = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUEST_BODY_BYTES = 256 * 1024;
const ALLOWED_ROLES = new Set(['admin', 'fl-admin', 'fl-empleado']);
const attemptsByUser = new Map<string, { count: number; resetAt: number }>();

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBoundedString(value: unknown, maxLength: number, allowEmpty = false): value is string {
  return typeof value === 'string'
    && value.length <= maxLength
    && (allowEmpty || value.trim().length > 0);
}

function isEmail(value: unknown): value is string {
  return isBoundedString(value, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

function createRequestSupabase(token: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase no está configurado en el servidor');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

async function authenticateRequest(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) return null;

  const supabase = createRequestSupabase(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { supabase, user: data.user };
}

function isRateLimited(userId: string) {
  const now = Date.now();
  const current = attemptsByUser.get(userId);

  if (!current || current.resetAt <= now) {
    attemptsByUser.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_EMAILS_PER_WINDOW;
}

function isValidTicketData(value: unknown): value is TicketData {
  if (!isRecord(value) || !Array.isArray(value.cartItems) || value.cartItems.length > 100) {
    return false;
  }

  const validItems = value.cartItems.every((item) => {
    if (!isRecord(item)) return false;

    return isBoundedString(item.id, 120)
      && isBoundedString(item.name, 300)
      && isFiniteNumber(item.price)
      && item.price >= 0
      && isFiniteNumber(item.quantity)
      && Number.isInteger(item.quantity)
      && item.quantity >= 0
      && item.quantity <= 1000
      && isBoundedString(item.image, 2048, true);
  });

  if (!validItems) return false;

  return isFiniteNumber(value.subtotal)
    && value.subtotal >= 0
    && isFiniteNumber(value.descuento)
    && value.descuento >= 0
    && isFiniteNumber(value.discountPercentage)
    && value.discountPercentage >= 0
    && value.discountPercentage <= 100
    && isFiniteNumber(value.iva)
    && value.iva >= 0
    && isFiniteNumber(value.total)
    && value.total >= 0
    && isBoundedString(value.metodoPago, 100)
    && isBoundedString(value.fecha, 80)
    && !Number.isNaN(new Date(value.fecha).getTime())
    && (value.pedidoId === undefined || isBoundedString(value.pedidoId, 120))
    && (value.discountLabel === undefined || isBoundedString(value.discountLabel, 160));
}

function isAllowedTicketUrl(ticketUrl: unknown): ticketUrl is string {
  if (!isBoundedString(ticketUrl, 2048)) return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  try {
    const ticket = new URL(ticketUrl);
    const project = new URL(supabaseUrl);
    return ticket.protocol === 'https:' && ticket.hostname === project.hostname;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Solicitud demasiado grande' },
        { status: 413 }
      );
    }

    const authenticated = await authenticateRequest(request);
    if (!authenticated) {
      return NextResponse.json(
        { success: false, error: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    const { supabase, user } = authenticated;
    const { data: profile, error: profileError } = await supabase
      .from('usuario')
      .select('rol, activo')
      .eq('email', user.email || '')
      .maybeSingle();

    if (profileError || !profile || profile.activo === false || !ALLOWED_ROLES.has(profile.rol)) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autorizado' },
        { status: 403 }
      );
    }

    if (isRateLimited(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Demasiados envíos. Inténtalo más tarde.' },
        { status: 429, headers: { 'Retry-After': '600' } }
      );
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Solicitud demasiado grande' },
        { status: 413 }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: 'JSON no válido' },
        { status: 400 }
      );
    }

    if (!isRecord(body) || body.type !== 'ticket-compra' || !isRecord(body.data)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de email no permitido' },
        { status: 400 }
      );
    }

    const { cliente: requestedClient, ticketData, ticketUrl } = body.data;
    if (!isRecord(requestedClient) || !isBoundedString(requestedClient.id, 80) || !isValidTicketData(ticketData)) {
      return NextResponse.json(
        { success: false, error: 'Datos de ticket no válidos' },
        { status: 400 }
      );
    }

    if (!isAllowedTicketUrl(ticketUrl)) {
      return NextResponse.json(
        { success: false, error: 'URL de ticket no permitida' },
        { status: 400 }
      );
    }

    const { data: client, error: clientError } = await supabase
      .from('cliente')
      .select('id, nombre, apellidos, email')
      .eq('id', requestedClient.id)
      .maybeSingle();

    if (clientError || !client || !isEmail(client.email)) {
      return NextResponse.json(
        { success: false, error: 'Cliente no válido' },
        { status: 400 }
      );
    }

    const cliente: Cliente = {
      id: client.id,
      nombre: client.nombre,
      apellidos: client.apellidos,
      email: client.email,
    };

    const result = await sendEmail({
      to: cliente.email,
      subject: TICKET_SUBJECT,
      react: TicketCompra({
        cliente,
        ticketData,
        ticketUrl,
      }) as ReactElement,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message,
        skipped: result.skipped,
      });
    }

    return NextResponse.json(
      { success: false, error: 'No se pudo enviar el email' },
      { status: 502 }
    );
  } catch (error) {
    console.error('Error en API send-email:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
