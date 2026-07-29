import { createContext, useContext, useReducer, useEffect, useState } from 'react';

const STORAGE_KEY = 'macluck_favorites';

const FavoritesContext = createContext();

function favoritesReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE': {
      const exists = state.find((f) => f.id === action.product.id);
      if (exists) {
        return state.filter((f) => f.id !== action.product.id);
      }
      return [...state, { ...action.product, selectedSpecs: action.specs || {} }];
    }
    case 'REMOVE':
      return state.filter((f) => f.id !== action.id);
    case 'LOAD':
      return action.items;
    default:
      return state;
  }
}

function loadFavorites() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, dispatch] = useReducer(favoritesReducer, []);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const items = loadFavorites();
    if (items.length > 0) {
      dispatch({ type: 'LOAD', items });
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const toggleFavorite = (product, specs) => dispatch({ type: 'TOGGLE', product, specs });
  const removeFromFavorites = (id) => dispatch({ type: 'REMOVE', id });
  const isFavorite = (id) => favorites.some((f) => f.id === id);

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, removeFromFavorites, favoritesCount: favorites.length }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
