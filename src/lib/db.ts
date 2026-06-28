import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * Neon serverless SQL client.
 * Uses HTTP-based queries — ideal for Next.js API Routes and Server Actions.
 *
 * Usage:
 *   const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
 */
export const sql = neon(process.env.DATABASE_URL);
