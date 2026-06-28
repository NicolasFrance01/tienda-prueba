/**
 * Formats a number as Argentine Peso (ARS)
 */
export function formatPrice(amount: number): string {
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
}
