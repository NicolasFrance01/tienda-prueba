import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header/Header';
import CartDrawer from '@/components/CartDrawer/CartDrawer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Tienda Dev — Catálogo de Productos',
  description:
    'Catálogo de productos de prueba para integración con Mercado Pago. Explorá nuestra selección de tecnología, bebidas, accesorios y más.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
