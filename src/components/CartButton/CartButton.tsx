'use client';

import { useCart } from '@/context/CartContext';
import styles from './CartButton.module.css';

export default function CartButton() {
  const { openCart, totalItems } = useCart();

  return (
    <button
      id="open-cart-btn"
      className={styles.btn}
      onClick={openCart}
      aria-label={`Abrir carrito (${totalItems} productos)`}
    >
      <span className={styles.icon}>🛒</span>
      {totalItems > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}
