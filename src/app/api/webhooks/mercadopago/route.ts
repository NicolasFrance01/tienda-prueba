import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { sql } from '@/lib/db';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const paymentClient = new Payment(mpClient);

/**
 * POST /api/webhooks/mercadopago
 *
 * Recibe notificaciones IPN de Mercado Pago.
 * Configurar en: https://www.mercadopago.com.ar/developers/panel → Webhooks
 * URL a registrar: https://tu-dominio.com/api/webhooks/mercadopago
 *
 * Documentación: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    console.log('[Webhook MP] Event received:', JSON.stringify({ type, data }));

    // Solo procesamos eventos de tipo 'payment'
    if (type !== 'payment') {
      return NextResponse.json({ received: true, skipped: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
    }

    // ── Obtener detalles del pago desde MP API ─────────────────────────────
    const payment = await paymentClient.get({ id: paymentId });

    const mpStatus = payment.status; // 'approved' | 'rejected' | 'pending' | 'in_process' | ...
    const orderId = payment.external_reference; // Nuestro order_id

    if (!orderId) {
      console.warn('[Webhook MP] Payment without external_reference:', paymentId);
      return NextResponse.json({ received: true });
    }

    // Mapear status de MP a nuestro schema
    const orderStatus =
      mpStatus === 'approved'
        ? 'approved'
        : mpStatus === 'rejected'
        ? 'rejected'
        : 'pending';

    // ── Actualizar orden en DB ─────────────────────────────────────────────
    await sql`
      UPDATE orders
      SET
        status        = ${orderStatus},
        mp_payment_id = ${String(paymentId)},
        updated_at    = NOW()
      WHERE id = ${Number(orderId)}
    `;

    console.log(`[Webhook MP] Order #${orderId} updated to "${orderStatus}" (payment: ${paymentId})`);

    return NextResponse.json({ received: true, order_id: orderId, status: orderStatus });
  } catch (error) {
    console.error('[Webhook MP] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
