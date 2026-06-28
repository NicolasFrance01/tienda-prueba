import { QRCodeSVG } from 'qrcode.react';
import { notFound } from 'next/navigation';
import { formatPrice } from '@/lib/formatPrice';
import styles from './TicketPage.module.css';

async function getOrder(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/orders/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.order;
}

export default async function TicketPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  // The QR code links to the admin panel for this specific order
  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin?order=${order.id}`;

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
