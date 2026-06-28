import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(255)`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(50)`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255)`;
  console.log('Buyer columns added to orders table.');
}
run().catch(console.error);
