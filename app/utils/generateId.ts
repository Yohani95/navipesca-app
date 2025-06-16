/**
 * Genera un ID único basado en timestamp, valores aleatorios y información adicional
 * Esta implementación es compatible con React Native y no necesita crypto.getRandomValues()
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const randomA = Math.floor(Math.random() * 10000);
  const randomB = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${randomA}-${randomB}`;
}

/**
 * Genera un ID único para un pesaje con múltiple información para garantizar unicidad
 */
export function generatePesajeId(embarcacionId?: number | string): string {
  const timestamp = Date.now();
  const randomA = Math.floor(Math.random() * 10000);
  const randomB = Math.floor(Math.random() * 10000);
  const prefix = embarcacionId ? `pesaje-emb-${embarcacionId}` : 'pesaje';

  return `${prefix}-${timestamp}-${randomA}-${randomB}`;
}

/**
 * Genera un ID único para un bin
 */
export function generateBinId(codigo?: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  const prefix = codigo ? `bin-${codigo}` : 'bin';

  return `${prefix}-${timestamp}-${random}`;
}
