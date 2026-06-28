'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/formatPrice';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedPwd = sessionStorage.getItem('admin_pwd');
    if (savedPwd) {
      setPassword(savedPwd);
      fetchOrders(savedPwd);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(password);
  };

  const fetchOrders = async (pwd: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${pwd}`,
        },
      });

      if (res.status === 401) {
        throw new Error('Contraseña incorrecta');
      }
      
      if (!res.ok) throw new Error('Error al cargar órdenes');

      const data = await res.json();
      setOrders(data.orders || []);
      setAuthenticated(true);
      sessionStorage.setItem('admin_pwd', pwd);
    } catch (err: any) {
      setError(err.message);
      setAuthenticated(false);
      sessionStorage.removeItem('admin_pwd');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className={styles.loginContainer}>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <h2>Acceso Privado</h2>
          <p>Ingresá la contraseña maestra para ver las órdenes.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <main className={styles.adminContainer}>
      <div className={styles.header}>
        <h2>Panel de Órdenes</h2>
        <button onClick={() => {
          sessionStorage.removeItem('admin_pwd');
          setAuthenticated(false);
        }} className={styles.logoutBtn}>Cerrar Sesión</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.ordersTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Método</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Comprador</th>
              <th>Contacto</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className={order.payment_method === 'transfer' && order.status === 'pending' ? styles.highlightRow : ''}>
                <td>#{order.id}</td>
                <td>{new Date(order.created_at).toLocaleDateString('es-AR', { hour: '2-digit', minute:'2-digit' })}</td>
                <td>
                  <span className={order.payment_method === 'transfer' ? styles.badgeTransfer : styles.badgeMp}>
                    {order.payment_method === 'transfer' ? 'CVU' : 'MP'}
                  </span>
                </td>
                <td>{formatPrice(order.total_amount)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  {order.buyer_name || '-'}
                </td>
                <td>
                  <div className={styles.contactActions}>
                    {order.buyer_phone && (
                      <a 
                        href={`https://wa.me/${order.buyer_phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(order.buyer_name || '')},%20te%20escribo%20por%20tu%20pedido%20#${order.id}%20en%20la%20tienda.`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.waBtn}
                        title="Abrir WhatsApp"
                      >
                        WhatsApp
                      </a>
                    )}
                    {order.buyer_email && (
                      <a 
                        href={`mailto:${order.buyer_email}?subject=Pedido%20#${order.id}`}
                        className={styles.emailBtn}
                        title="Enviar Email"
                      >
                        Email
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyState}>No hay órdenes todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
