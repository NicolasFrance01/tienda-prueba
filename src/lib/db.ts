import { neon } from '@neondatabase/serverless';

/**
 * Lazy SQL client — se inicializa en el primer uso (request time),
 * NO en la evaluación del módulo (build time).
 *
 * Esto evita el error "DATABASE_URL is not set" durante `next build`
 * cuando Vercel aún no tiene las variables de entorno disponibles.
 */
let _client: ReturnType<typeof neon> | null = null;

function getClient(): ReturnType<typeof neon> {
  if (!_client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _client = neon(url);
  }
  return _client;
}

/**
 * Tagged template literal SQL function.
 * Se usa exactamente igual que antes:
 *   const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
 */
export function sql(
  strings: TemplateStringsArray,
  ...params: unknown[]
): Promise<unknown[]> {
  return getClient()(strings, ...params) as Promise<unknown[]>;
}
