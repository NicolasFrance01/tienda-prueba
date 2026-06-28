'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/formatPrice';
import CartItem from '@/components/CartItem/CartItem';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { items, isOpen, closeCart, totalItems, totalPrice } = useCart();
  const router = useRouter();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [closeCart]);

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        aria-label="Carrito de compras"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.cartIcon}>🛒</span>
            <h2 className={styles.title}>
              Mi Carrito
              {totalItems > 0 && (
                <span className={styles.badge}>{totalItems}</span>
              )}
            </h2>
          </div>
          <button
            id="close-cart-btn"
            className={styles.closeBtn}
            onClick={closeCart}
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🛒</span>
              <p className={styles.emptyTitle}>Tu carrito está vacío</p>
              <p className={styles.emptyText}>
                Agregá productos para comenzar tu compra
              </p>
              <button
                className={styles.shopBtn}
                onClick={closeCart}
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>
                Subtotal ({totalItems} {totalItems === 1 ? 'producto' : 'productos'})
              </span>
              <span className={styles.summaryValue}>{formatPrice(totalPrice)}</span>
            </div>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>{formatPrice(totalPrice)}</span>
            </div>
            <button
              id="checkout-btn"
              className={styles.checkoutBtn}
              onClick={handleCheckout}
            >
              Continuar con la compra →
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
