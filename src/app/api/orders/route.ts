import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { sql } from '@/lib/db';
import { CreateOrderPayload } from '@/types/db';

// ── Mercado Pago client ────────────────────────────────────────────────────────
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const preferenceClient = new Preference(mpClient);

// ── POST /api/orders ──────────────────────────────────────────────────────────
/**
 * 1. Valida el carrito
 * 2. Guarda la orden en Neon DB (status: 'pending')
 * 3. Crea la preferencia en Mercado Pago
 * 4. Actualiza la orden con mp_preference_id
 * 5. Devuelve preference_id + init_point al cliente
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderPayload = await req.json();

    // ── Validar ────────────────────────────────────────────────────────────
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }
    if (typeof body.total_amount !== 'number' || body.total_amount <= 0) {
      return NextResponse.json({ error: 'total_amount inválido' }, { status: 400 });
    }

    // ── Insertar orden en DB ───────────────────────────────────────────────
    const paymentMethod = body.payment_method === 'transfer' ? 'transfer' : 'mp';

    const orderRows = await sql`
      INSERT INTO orders (status, total_amount, currency, items_count, payment_method, buyer_name, buyer_phone, buyer_email)
      VALUES (
        'pending',
        ${body.total_amount},
        'ARS',
        ${body.items.reduce((sum, i) => sum + i.quantity, 0)},
        ${paymentMethod},
        ${body.buyer_name || null},
        ${body.buyer_phone || null},
        ${body.buyer_email || null}
      )
      RETURNING id, created_at
    ` as { id: number; created_at: string }[];

    const [order] = orderRows;

    // ── Insertar items ─────────────────────────────────────────────────────
    for (const item of body.items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
        VALUES (
          ${order.id},
          ${item.product_id},
          ${item.product_name},
          ${item.product_price},
          ${item.quantity},
          ${item.product_price * item.quantity}
        )
      `;
    }

    // ── Lógica de Mercado Pago (solo si el método es 'mp') ────────────────
    if (paymentMethod === 'mp') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

      const mpPreference = await preferenceClient.create({
        body: {
          external_reference: String(order.id),
          items: body.items.map((item) => ({
            id: item.product_id,
            title: item.product_name,
            quantity: item.quantity,
            unit_price: item.product_price,
            currency_id: 'ARS',
          })),
          back_urls: {
            success: `${baseUrl}/checkout/success`,
            failure: `${baseUrl}/checkout/failure`,
            pending: `${baseUrl}/checkout/pending`,
          },
          auto_return: 'approved',
          statement_descriptor: 'Tienda Dev',
          metadata: {
            order_id: order.id,
          },
        },
      });

      await sql`
        UPDATE orders
        SET mp_preference_id = ${mpPreference.id ?? null},
            updated_at       = NOW()
        WHERE id = ${order.id}
      `;

      const useSandbox = process.env.MP_SANDBOX === 'true';
      const initPoint = useSandbox
        ? mpPreference.sandbox_init_point
        : mpPreference.init_point;

      return NextResponse.json(
        {
          order_id: order.id,
          preference_id: mpPreference.id,
          init_point: initPoint,
          created_at: order.created_at,
        },
        { status: 201 }
      );
    }

    // ── Respuesta para Transferencia ───────────────────────────────────────
    return NextResponse.json(
      {
        order_id: order.id,
        status: 'pending',
        created_at: order.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/orders] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ── GET /api/orders ───────────────────────────────────────────────────────────
/**
 * Devuelve todas las órdenes con sus items (útil para panel de admin).
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (expectedPassword && authHeader !== `Bearer ${expectedPassword}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const orders = await sql`
      SELECT
        o.id,
        o.status,
        o.total_amount,
        o.currency,
        o.payment_method,
        o.buyer_name,
        o.buyer_phone,
        o.buyer_email,
        o.items_count,
        o.mp_preference_id,
        o.mp_payment_id,
        o.created_at,
        o.updated_at,
        json_agg(
          json_build_object(
            'id',            oi.id,
            'product_id',    oi.product_id,
            'product_name',  oi.product_name,
            'product_price', oi.product_price,
            'quantity',      oi.quantity,
            'subtotal',      oi.subtotal
          )
          ORDER BY oi.id
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[GET /api/orders] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
