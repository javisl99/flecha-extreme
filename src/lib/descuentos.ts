export type DescuentoModo = 'porcentaje' | 'importe';

export function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function clampDiscountValue(value: number, subtotal: number) {
  return roundCurrency(Math.min(Math.max(value, 0), Math.max(subtotal, 0)));
}

export function calculateDiscountAmount(
  subtotal: number,
  modo: DescuentoModo,
  valor: number
) {
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return 0;
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    return 0;
  }

  if (modo === 'porcentaje') {
    return roundCurrency((subtotal * valor) / 100);
  }

  return clampDiscountValue(valor, subtotal);
}

export function calculateDiscountPercentage(subtotal: number, descuento: number) {
  if (!Number.isFinite(subtotal) || subtotal <= 0 || !Number.isFinite(descuento) || descuento <= 0) {
    return 0;
  }

  return roundCurrency((descuento / subtotal) * 100);
}
