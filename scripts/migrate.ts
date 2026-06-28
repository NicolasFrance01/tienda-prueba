/**
 * Database migration script.
 * Run once to create the schema in Neon:
 *   npx tsx scripts/migrate.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('🚀 Running migrations...\n');

  // ── orders ────────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id              SERIAL PRIMARY KEY,
      status          VARCHAR(50)    NOT NULL DEFAULT 'pending',
      total_amount    NUMERIC(12, 2) NOT NULL,
      currency        CHAR(3)        NOT NULL DEFAULT 'ARS',
      items_count     INTEGER        NOT NULL,
      mp_preference_id TEXT,
      mp_payment_id   TEXT,
      created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ Table: orders');

  // ── order_items ───────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id            SERIAL PRIMARY KEY,
      order_id      INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id    VARCHAR(50)    NOT NULL,
      product_name  VARCHAR(255)   NOT NULL,
      product_price NUMERIC(12, 2) NOT NULL,
      quantity      INTEGER        NOT NULL,
      subtotal      NUMERIC(12, 2) NOT NULL
    );
  `;
  console.log('✓ Table: order_items');

  // ── Index para búsquedas por estado ───────────────────────────────────────
  await sql`
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  `;
  console.log('✓ Indexes created');

  console.log('\n✅ Migration complete!');
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
