'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import styles from '../result.module.css';

function FailureContent() {
  const params = useSearchParams();
  const externalRef = params.get('external_reference');

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.icon}>❌</span>
        <h1 className={styles.title}>Pago rechazado</h1>
        <p className={styles.description}>
          Tu pago no pudo procesarse. Podés intentarlo nuevamente con otro
          medio de pago o verificar los datos de tu tarjeta.
        </p>

        {externalRef && (
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Orden N°</span>
              <span className={styles.detailValue}>#{externalRef}</span>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/checkout" className={styles.primaryBtn}>
            Reintentar pago
          </Link>
          <Link href="/catalogo" className={styles.secondaryBtn}>
            Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FailurePage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Cargando...</div>}>
      <FailureContent />
    </Suspense>
  );
}
