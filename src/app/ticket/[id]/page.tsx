import { QRCodeSVG } from 'qrcode.react';
import { notFound } from 'next/navigation';
import { formatPrice } from '@/lib/formatPrice';
import styles from './TicketPage.module.css';

import { sql } from '@/lib/db';

async function getOrder(id: string) {
  const orderId = parseInt(id, 10);
  if (isNaN(orderId)) return null;

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
  return orders.length > 0 ? orders[0] : null;
}

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  const adminUrl = `${baseUrl}/admin?order=${order.id}`;

  return (
    <main className={styles.page}>
      <div className={styles.ticketCard}>
        <div className={styles.ticketHeader}>
          <h2>Ticket de Compra</h2>
          <span className={styles.orderId}># {order.id.toString().padStart(6, '0')}</span>
        </div>

        <div className={styles.ticketBody}>
          <p className={styles.status}>Estado: <strong>{order.status === 'pending' ? 'Pendiente de Pago' : order.status}</strong></p>
          <p className={styles.date}>{new Date(order.created_at).toLocaleString('es-AR')}</p>

          <hr className={styles.divider} />

          <div className={styles.buyerInfo}>
            <h3>Datos del Comprador</h3>
            <p><strong>Nombre:</strong> {order.buyer_name || 'N/A'}</p>
            <p><strong>WhatsApp:</strong> {order.buyer_phone || 'N/A'}</p>
            <p><strong>Email:</strong> {order.buyer_email || 'N/A'}</p>
          </div>

          <hr className={styles.divider} />

          <div className={styles.orderSummary}>
            <h3>Resumen de la Orden</h3>
            <ul className={styles.itemsList}>
              {order.items.map((item: any) => (
                <li key={item.id}>
                  <span>{item.quantity}x {item.product_name}</span>
                  <span>{formatPrice(item.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className={styles.totalRow}>
              <span>Total:</span>
              <strong>{formatPrice(order.total_amount)}</strong>
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.qrSection}>
            <p className={styles.qrInstructions}>
              Guardá captura de este ticket.<br/>
              Si hiciste transferencia, envianos el comprobante para confirmar el pago.
            </p>
            <div className={styles.qrCodeWrapper}>
              <QRCodeSVG value={adminUrl} size={150} level="M" />
            </div>
            <small>Uso interno (escanear para ver en admin)</small>
          </div>
        </div>
      </div>
    </main>
  );
}
