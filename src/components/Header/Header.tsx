import Link from 'next/link';
import CartButton from '@/components/CartButton/CartButton';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/catalogo" className={styles.logo}>
          <span className={styles.logoIcon}>🛍️</span>
          <span className={styles.logoText}>
            <span className={styles.logoMain}>tienda</span>
            <span className={styles.logoDot}>.</span>
            <span className={styles.logoSub}>dev</span>
          </span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/catalogo" className={styles.navLink}>
            Catálogo
          </Link>
        </nav>

        <CartButton />
      </div>
    </header>
  );
}
