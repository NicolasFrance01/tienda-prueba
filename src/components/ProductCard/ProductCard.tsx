'use client';

import Image from 'next/image';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/formatPrice';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCart();

  const cartItem = items.find((i) => i.product.id === product.id);
  const quantityInCart = cartItem?.quantity ?? 0;
  const isOutOfStock = product.stock === 0;

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={styles.image}
        />
        <span className={styles.category}>{product.category}</span>
        {isOutOfStock && <span className={styles.outOfStock}>Sin stock</span>}
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.description}>{product.description}</p>

        <div className={styles.footer}>
          <div className={styles.priceBlock}>
            <span className={styles.price}>{formatPrice(product.price)}</span>
            <span className={styles.stock}>
              {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
            </span>
          </div>

          <button
            id={`add-to-cart-${product.id}`}
            className={`${styles.addBtn} ${quantityInCart > 0 ? styles.added : ''}`}
            onClick={() => addItem(product)}
            disabled={isOutOfStock}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            {quantityInCart > 0 ? (
              <>
                <span className={styles.checkIcon}>✓</span>
                En carrito ({quantityInCart})
              </>
            ) : (
              <>
                <span className={styles.plusIcon}>+</span>
                Agregar
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
