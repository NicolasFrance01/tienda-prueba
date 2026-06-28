'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import styles from '../result.module.css';

function SuccessContent() {
  const params = useSearchParams();
  const paymentId = params.get('payment_id');
  const externalRef = params.get('external_reference');
  const status = params.get('status');

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.icon}>✅</span>
        <h1 className={styles.title}>¡Pago aprobado!</h1>
        <p className={styles.description}>
          Tu pago fue procesado con éxito. En breve recibirás la confirmación
          por correo electrónico.
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
            {status && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Estado</span>
                <span className={`${styles.detailValue} ${styles.approved}`}>
                  {status}
                </span>
              </div>
            )}
          </div>
        )}

        <Link href="/catalogo" className={styles.primaryBtn}>
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
