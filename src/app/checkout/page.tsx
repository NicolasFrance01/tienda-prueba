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
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mp' | 'transfer'>('mp');
  
  // ── Datos del Comprador (Transferencia) ──
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  // ── Copiar al portapapeles ──
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado: ${text}`);
  };

  // ── Crear orden en DB + procesar pago ─────
  const handleCheckout = async () => {
    if (paymentMethod === 'transfer') {
      if (!buyerName || !buyerPhone || !buyerEmail) {
        setError('Por favor completá todos tus datos para poder identificarte.');
        return;
      }
    }
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
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        buyer_email: buyerEmail,
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
        // Redirigir al Ticket de Transferencia
        clearCart();
        window.location.href = `/ticket/${data.order_id}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };



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

          {/* ── Transfer Details & Form Box ── */}
          {paymentMethod === 'transfer' && (
            <div className={styles.transferBox}>
              <h3>Completá tus datos</h3>
              <p className={styles.transferDesc}>
                Necesitamos esta información para validar tu pago y poder contactarte.
              </p>
              
              <div className={styles.formGroup}>
                <label>Nombre y Apellido</label>
                <input 
                  type="text" 
                  value={buyerName} 
                  onChange={(e) => setBuyerName(e.target.value)} 
                  placeholder="Ej: Juan Pérez" 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Número de WhatsApp</label>
                <input 
                  type="tel" 
                  value={buyerPhone} 
                  onChange={(e) => setBuyerPhone(e.target.value)} 
                  placeholder="Ej: 1123456789" 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={buyerEmail} 
                  onChange={(e) => setBuyerEmail(e.target.value)} 
                  placeholder="Ej: juan@email.com" 
                />
              </div>

              <hr className={styles.divider} />

              <h3>Datos para transferir</h3>
              <p>Transferí exactamente <strong>{formatPrice(totalPrice)}</strong> a los siguientes datos:</p>
              
              <div className={styles.transferDetails}>
                <div className={styles.transferRow}>
                  <span>CVU/CBU:</span>
                  <div className={styles.copyGroup}>
                    <strong>{process.env.NEXT_PUBLIC_SELLER_CVU || '0000003100000000000000'}</strong>
                    <button className={styles.copyBtn} onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_SELLER_CVU || '0000003100000000000000', 'CVU')}>Copiar</button>
                  </div>
                </div>
                <div className={styles.transferRow}>
                  <span>Alias:</span>
                  <div className={styles.copyGroup}>
                    <strong>{process.env.NEXT_PUBLIC_SELLER_ALIAS || 'MI.TIENDA.MP'}</strong>
                    <button className={styles.copyBtn} onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_SELLER_ALIAS || 'MI.TIENDA.MP', 'Alias')}>Copiar</button>
                  </div>
                </div>
                <div className={styles.transferRow}>
                  <span>Total:</span>
                  <div className={styles.copyGroup}>
                    <strong>{formatPrice(totalPrice)}</strong>
                    <button className={styles.copyBtn} onClick={() => copyToClipboard(totalPrice.toString(), 'Monto')}>Copiar</button>
                  </div>
                </div>
              </div>

              <a 
                href="https://www.mercadopago.com.ar/" 
                target="_blank" 
                rel="noreferrer" 
                className={styles.mpExternalLink}
              >
                Abrir App de Mercado Pago
              </a>

              <p className={styles.transferHint}>
                Después de transferir, hacé clic en "Confirmar pedido" para generar tu ticket.
              </p>
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
