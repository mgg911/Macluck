// oxlint-disable react/only-export-components
import { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { getProductImages, getProductPrice, sanitizeProductSpecs } from '../utils/productVariants';
import { useCatalog } from './CatalogContext';

const STORAGE_KEY = 'macluck_cart';

const CartContext = createContext();

const clampQuantity = (value) => Math.max(1, Math.min(99, Math.floor(Number(value) || 1)));

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.productId === action.productId && JSON.stringify(i.specs) === JSON.stringify(action.specs)
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === existing.productId && JSON.stringify(i.specs) === JSON.stringify(existing.specs)
              ? { ...i, quantity: clampQuantity(i.quantity + action.quantity) }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action, quantity: clampQuantity(action.quantity) }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.cartId !== action.cartId) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.cartId === action.cartId ? { ...i, quantity: clampQuantity(action.quantity) } : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'LOAD_CART':
      return { ...state, items: action.items };
    case 'SYNC_CATALOG':
      return {
        ...state,
        items: state.items.filter((item) => action.products.some((candidate) => String(candidate.id) === String(item.productId))).map((item) => {
          const product = action.products.find((candidate) => String(candidate.id) === String(item.productId));
          if (!product) return item;
          const specs = sanitizeProductSpecs(product, item.specs || {});
          return {
            ...item,
            name: product.name,
            price: getProductPrice(product, specs),
            image: getProductImages(product, specs)[0] || product.image,
            specs,
          };
        }),
      };
    default:
      return state;
  }
}

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { products } = useCatalog();
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const items = loadCart();
    if (items.length > 0) {
      dispatch({ type: 'LOAD_CART', items });
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    }
  }, [state.items, isLoaded]);

  useEffect(() => {
    if (isLoaded && products.length) dispatch({ type: 'SYNC_CATALOG', products });
  }, [products, isLoaded]);

  const addToCart = (product, specs, quantity = 1) => {
    const selectedSpecs = sanitizeProductSpecs(product, specs);
    const cartId = `${product.id}-${Date.now()}`;
    dispatch({
      type: 'ADD_ITEM',
      cartId,
      productId: product.id,
      name: product.name,
      price: getProductPrice(product, selectedSpecs),
      image: getProductImages(product, selectedSpecs)[0] || product.image,
      specs: selectedSpecs,
      quantity: clampQuantity(quantity),
    });
    setIsOpen(true);
  };

  const removeFromCart = (cartId) => dispatch({ type: 'REMOVE_ITEM', cartId });
  const updateQuantity = (cartId, quantity) => dispatch({ type: 'UPDATE_QUANTITY', cartId, quantity });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
