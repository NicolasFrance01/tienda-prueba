'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import styles from '../result.module.css';

function PendingContent() {
  const params = useSearchParams();
  const paymentId = params.get('payment_id');
  const externalRef = params.get('external_reference');

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.icon}>⏳</span>
        <h1 className={styles.title}>Pago en proceso</h1>
        <p className={styles.description}>
          Tu pago está siendo procesado. Mercado Pago te notificará por correo
          electrónico cuando se confirme.
        </p>

        {(paymentId || externalRef) && (
          <div className={styles.details}>
            {externalRef && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Orden N°</span>
                <span className={styles.detailValue}>#{externalRef}</span>
              </div>
            )}
            {paymentId && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Pago MP N°</span>
                <span className={styles.detailValue}>{paymentId}</span>
              </div>
            )}
          </div>
        )}

        <Link href="/catalogo" className={styles.primaryBtn}>
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Cargando...</div>}>
      <PendingContent />
    </Suspense>
  );
}
