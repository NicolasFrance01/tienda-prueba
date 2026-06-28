'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { CartState, CartAction, CartItem, Product } from '@/types';

// ─── Reducer ─────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (item) => item.product.id === action.payload.id
      );
      if (existing) {
        // Increment but don't exceed stock
        const updatedItems = state.items.map((item) =>
          item.product.id === action.payload.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.product.stock),
              }
            : item
        );
        return { ...state, items: updatedItems };
      }
      return {
        ...state,
        items: [...state.items, { product: action.payload, quantity: 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.payload),
      };

    case 'INCREMENT': {
      const updatedItems = state.items.map((item) =>
        item.product.id === action.payload
          ? {
              ...item,
              quantity: Math.min(item.quantity + 1, item.product.stock),
            }
          : item
      );
      return { ...state, items: updatedItems };
    }

    case 'DECREMENT': {
      const updatedItems = state.items
        .map((item) =>
          item.product.id === action.payload
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);
      return { ...state, items: updatedItems };
    }

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'tienda_cart';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
  });

  // Hydrate from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        parsed.forEach((item) => {
          for (let i = 0; i < item.quantity; i++) {
            dispatch({ type: 'ADD_ITEM', payload: item.product });
          }
        });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to LocalStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const value: CartContextValue = {
    items: state.items,
    isOpen: state.isOpen,
    totalItems,
    totalPrice,
    addItem: (product) => dispatch({ type: 'ADD_ITEM', payload: product }),
    removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
    increment: (id) => dispatch({ type: 'INCREMENT', payload: id }),
    decrement: (id) => dispatch({ type: 'DECREMENT', payload: id }),
    openCart: () => dispatch({ type: 'OPEN_CART' }),
    closeCart: () => dispatch({ type: 'CLOSE_CART' }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  return ctx;
}
