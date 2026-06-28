import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
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
        o.created_at,
        json_agg(
          json_build_object(
            'id',            oi.id,
            'product_name',  oi.product_name,
            'quantity',      oi.quantity,
            'subtotal',      oi.subtotal
          )
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ${orderId}
      GROUP BY o.id
    `;

    if (orders.length === 0) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ order: orders[0] });
  } catch (error) {
    console.error('[GET /api/orders/[id]] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
