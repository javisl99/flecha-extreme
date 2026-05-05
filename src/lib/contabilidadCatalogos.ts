import type { SupabaseClient } from '@supabase/supabase-js';
import { LegacyMetodoPagoCode } from '@/shared/types';
import { paymentMethodCodeLabel } from './contabilidad';

type SupabaseLike = Pick<SupabaseClient, 'from'>;

export const ACTIVE_PAYMENT_METHOD_CODES = [
  'efectivo',
  'tpv',
  'transferencia',
  'bizum_alfonso',
] as const satisfies readonly LegacyMetodoPagoCode[];

export const ACTIVE_PAYMENT_METHOD_OPTIONS = ACTIVE_PAYMENT_METHOD_CODES.map((code) => ({
  value: code,
  label: paymentMethodCodeLabel(code),
}));

export async function resolvePaymentMethodIdByCode(
  client: SupabaseLike,
  code?: string | null
) {
  if (!code) return null;

  const { data, error } = await client
    .from('contabilidad_metodo_pago')
    .select('id')
    .eq('codigo', code)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id || null;
}
