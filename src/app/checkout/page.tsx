'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/formatPrice';
import styles from './CheckoutPage.module.css';

/**
 * CheckoutPage — order summary screen.
 *
 * Flow cuando se integre Mercado Pago:
 *  1. handleMercadoPago() llama a POST /api/orders → guarda la orden en Neon
 *  2. La API devuelve { init_point } (una vez conectado el SDK de MP)
 *  3. Redirigir a init_point
 *
 * Por ahora guarda la orden en DB con status 'pending' y muestra confirmación.
 */
export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Crear orden en DB + preferencia en MP → redirigir ─────
  const handleMercadoPago = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product.id,
          product_name: i.product.name,
          product_price: i.product.price,
          quantity: i.quantity,
        })),
        total_amount: totalPrice,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Error al procesar la orden');
      }

      const data = await res.json();

      // Redirigir al checkout de Mercado Pago
      if (data.init_point) {
        clearCart();
        window.location.href = data.init_point;
      } else {
        // Fallback: mostrar confirmación si no hay init_point
        setSavedOrderId(data.order_id);
        clearCart();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // ── Orden guardada con éxito ──────────────────────────────
  if (savedOrderId) {
    return (
      <div className={`container ${styles.empty}`}>
        <span className={styles.emptyIcon}>✅</span>
        <h1 className={styles.emptyTitle}>¡Orden registrada!</h1>
        <p className={styles.emptyText}>
          Tu orden <strong>#{savedOrderId}</strong> fue guardada correctamente.
          <br />
          Cuando conectemos Mercado Pago, serás redirigido al pago automáticamente.
        </p>
        <Link href="/catalogo" className={styles.backBtn}>
          ← Volver al catálogo
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`container ${styles.empty}`}>
        <span className={styles.emptyIcon}>🛍️</span>
        <h1 className={styles.emptyTitle}>No tenés productos en el carrito</h1>
        <p className={styles.emptyText}>
          Volvé al catálogo y agregá productos para continuar.
        </p>
        <Link href="/catalogo" className={styles.backBtn}>
          ← Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.breadcrumb}>
        <Link href="/catalogo" className={styles.breadcrumbLink}>
          Catálogo
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Checkout</span>
      </div>

      <h1 className={styles.pageTitle}>Resumen del pedido</h1>

      <div className={styles.layout}>
        {/* ── Order items ── */}
        <section className={styles.orderSection}>
          <h2 className={styles.sectionTitle}>
            Productos ({totalItems})
          </h2>

          <div className={styles.itemsList}>
            {items.map(({ product, quantity }) => (
              <div key={product.id} className={styles.orderItem}>
                <div className={styles.orderImageWrapper}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="80px"
                    className={styles.orderImage}
                  />
                </div>
                <div className={styles.orderInfo}>
                  <p className={styles.orderName}>{product.name}</p>
                  <p className={styles.orderCategory}>{product.category}</p>
                  <p className={styles.orderQty}>Cantidad: {quantity}</p>
                </div>
                <div className={styles.orderPrices}>
                  <p className={styles.orderUnitPrice}>
                    {formatPrice(product.price)} c/u
                  </p>
                  <p className={styles.orderSubtotal}>
                    {formatPrice(product.price * quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Payment summary ── */}
        <aside className={styles.paymentCard}>
          <h2 className={styles.sectionTitle}>Resumen de pago</h2>

          <div className={styles.summaryLines}>
            <div className={styles.summaryLine}>
              <span>Productos ({totalItems})</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className={styles.summaryLine}>
              <span>Envío</span>
              <span className={styles.freeShipping}>Gratis</span>
            </div>
          </div>

          <div className={styles.totalBlock}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>{formatPrice(totalPrice)}</span>
          </div>

          {/* ── Error message ── */}
          {error && (
            <p className={styles.errorMsg}>⚠️ {error}</p>
          )}

          {/* ══ Mercado Pago CTA ═════════════════════════════
              POST /api/orders guarda la orden en Neon DB.
              Cuando conectes MP, la API devolverá init_point.
          ══════════════════════════════════════════════════ */}
          <button
            id="pay-with-mp-btn"
            className={`${styles.mpBtn} ${loading ? styles.mpBtnLoading : ''}`}
            onClick={handleMercadoPago}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <span className={styles.mpLogo}>💳</span>
            )}
            {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
          </button>

          <p className={styles.mpDisclaimer}>
            Serás redirigido a Mercado Pago para completar tu pago de forma
            segura.
          </p>

          <Link href="/catalogo" className={styles.continueShop}>
            ← Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
