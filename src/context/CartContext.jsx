import { createContext, useContext, useReducer, useState, useEffect } from 'react';

const STORAGE_KEY = 'macluck_cart';

const CartContext = createContext();

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
              ? { ...i, quantity: i.quantity + action.quantity }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action, quantity: action.quantity || 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.cartId !== action.cartId) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.cartId === action.cartId ? { ...i, quantity: Math.max(1, action.quantity) } : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'LOAD_CART':
      return { ...state, items: action.items };
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

  const addToCart = (product, specs, quantity = 1) => {
    const cartId = `${product.id}-${Date.now()}`;
    dispatch({
      type: 'ADD_ITEM',
      cartId,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      specs,
      quantity,
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
