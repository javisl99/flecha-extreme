/**
 * Formatea un número para mostrar en español
 * @param value - El número a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String formateado con comas como separadores de miles y punto como separador decimal
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formatea un precio en euros para mostrar en español
 * @param value - El precio a formatear
 * @returns String formateado con el símbolo del euro
 */
export function formatPrice(value: number): string {
  return `${formatNumber(value)} €`;
}
