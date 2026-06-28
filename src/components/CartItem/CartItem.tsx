'use client';

import Image from 'next/image';
import { CartItem as CartItemType } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/formatPrice';
import styles from './CartItem.module.css';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { increment, decrement, removeItem } = useCart();
  const { product, quantity } = item;

  return (
    <div className={styles.item}>
      <div className={styles.imageWrapper}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="72px"
          className={styles.image}
        />
      </div>

      <div className={styles.info}>
        <p className={styles.name}>{product.name}</p>
        <p className={styles.unitPrice}>{formatPrice(product.price)} c/u</p>

        <div className={styles.controls}>
          <div className={styles.qtyGroup}>
            <button
              id={`decrement-${product.id}`}
              className={styles.qtyBtn}
              onClick={() => decrement(product.id)}
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className={styles.qty}>{quantity}</span>
            <button
              id={`increment-${product.id}`}
              className={styles.qtyBtn}
              onClick={() => increment(product.id)}
              disabled={quantity >= product.stock}
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>

          <span className={styles.subtotal}>
            {formatPrice(product.price * quantity)}
          </span>
        </div>
      </div>

      <button
        id={`remove-${product.id}`}
        className={styles.removeBtn}
        onClick={() => removeItem(product.id)}
        aria-label={`Eliminar ${product.name} del carrito`}
      >
        ✕
      </button>
    </div>
  );
}
