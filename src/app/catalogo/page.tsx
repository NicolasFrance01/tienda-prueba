import type { Metadata } from 'next';
import { products } from '@/data/products';
import ProductGrid from '@/components/ProductGrid/ProductGrid';

export const metadata: Metadata = {
  title: 'Catálogo — Tienda Dev',
  description:
    'Explorá nuestro catálogo de productos: tecnología, bebidas, ropa, accesorios y más. Precios en pesos argentinos.',
};

export default function CatalogoPage() {
  return (
    <div className="container">
      <ProductGrid products={products} />
    </div>
  );
}
