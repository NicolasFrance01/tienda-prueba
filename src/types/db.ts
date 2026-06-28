/** Fila de la tabla `orders` */
export interface OrderRow {
  id: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  total_amount: string;
  currency: string;
  items_count: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Fila de la tabla `order_items` */
export interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: string;
  product_name: string;
  product_price: string;
  quantity: number;
  subtotal: string;
}

/** Payload para crear una orden (POST /api/orders) */
export interface CreateOrderPayload {
  items: Array<{
    product_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
  }>;
  total_amount: number;
  payment_method?: 'mp' | 'transfer';
  buyer_name?: string;
  buyer_phone?: string;
  buyer_email?: string;
}

/** Respuesta de POST /api/orders */
export interface CreateOrderResponse {
  order_id: number;
  status: string;
  total_amount: string;
  created_at: string;
}
