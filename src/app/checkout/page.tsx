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
  const [paymentMethod, setPaymentMethod] = useState<'mp' | 'transfer'>('mp');

  // ── Crear orden en DB + procesar pago ─────
  const handleCheckout = async () => {
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
        payment_method: paymentMethod,
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

      // Redirigir según método de pago
      if (paymentMethod === 'mp' && data.init_point) {
        clearCart();
        window.location.href = data.init_point;
      } else {
        // Fallback o Transferencia (va a pending/success manual)
        clearCart();
        window.location.href = `/checkout/pending?external_reference=${data.order_id}&method=transfer`;
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

          {/* ── Payment Method Selector ── */}
          <div className={styles.methodSelector}>
            <h3 className={styles.methodTitle}>Medio de pago</h3>
            
            <label className={`${styles.methodOption} ${paymentMethod === 'mp' ? styles.methodActive : ''}`}>
              <input
                type="radio"
                name="payment_method"
                value="mp"
                checked={paymentMethod === 'mp'}
                onChange={() => setPaymentMethod('mp')}
              />
              <span className={styles.methodDetails}>
                <strong>Mercado Pago</strong>
                <small>Tarjetas, débito, saldo</small>
              </span>
              <span className={styles.methodIcon}>💳</span>
            </label>

            <label className={`${styles.methodOption} ${paymentMethod === 'transfer' ? styles.methodActive : ''}`}>
              <input
                type="radio"
                name="payment_method"
                value="transfer"
                checked={paymentMethod === 'transfer'}
                onChange={() => setPaymentMethod('transfer')}
              />
              <span className={styles.methodDetails}>
                <strong>Transferencia / CVU</strong>
                <small>Acreditación rápida</small>
              </span>
              <span className={styles.methodIcon}>🏦</span>
            </label>
          </div>

          {/* ── Transfer Details Box ── */}
          {paymentMethod === 'transfer' && (
            <div className={styles.transferBox}>
              <p>Transferí exactamente <strong>{formatPrice(totalPrice)}</strong> a los siguientes datos:</p>
              <div className={styles.transferDetails}>
                <div className={styles.transferRow}>
                  <span>CVU/CBU:</span>
                  <strong>{process.env.NEXT_PUBLIC_SELLER_CVU || '0000003100000000000000'}</strong>
                </div>
                <div className={styles.transferRow}>
                  <span>Alias:</span>
                  <strong>{process.env.NEXT_PUBLIC_SELLER_ALIAS || 'MI.TIENDA.MP'}</strong>
                </div>
                <div className={styles.transferRow}>
                  <span>Titular:</span>
                  <strong>Tienda Prueba</strong>
                </div>
              </div>
              <p className={styles.transferHint}>Al finalizar vas a poder enviarnos el comprobante.</p>
            </div>
          )}

          {/* ── Error message ── */}
          {error && (
            <p className={styles.errorMsg}>⚠️ {error}</p>
          )}

          {/* ══ CTA Button ════════════════════════════════════ */}
          <button
            id="pay-btn"
            className={`${paymentMethod === 'mp' ? styles.mpBtn : styles.primaryBtn} ${loading ? styles.btnLoading : ''}`}
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : paymentMethod === 'mp' ? (
              <span className={styles.mpLogo}>💳</span>
            ) : (
              <span className={styles.mpLogo}>🏦</span>
            )}
            
            {loading 
              ? 'Procesando...' 
              : paymentMethod === 'mp' 
                ? 'Pagar con Mercado Pago' 
                : 'Confirmar pedido'}
          </button>

          {paymentMethod === 'mp' && (
            <p className={styles.mpDisclaimer}>
              Serás redirigido a Mercado Pago para completar tu pago de forma segura.
            </p>
          )}

          <Link href="/catalogo" className={styles.continueShop}>
            ← Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
