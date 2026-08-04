// oxlint-disable react/only-export-components
import { createContext, useContext, useEffect, useState } from "react";
import { products as initialProducts, categories, banners } from "../data/products";
import { api } from '../lib/api';

const CatalogContext = createContext();

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(initialProducts);
  const [remote, setRemote] = useState({ categories, banners });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/public').then((data) => {
      setProducts(data.products);
      setRemote({ categories: data.categories, banners: data.banners });
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const addProduct = (product) => {
    setProducts((prev) => [...prev, product]);
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const editProduct = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === updatedProduct.id ? updatedProduct : item
      )
    );
  };

  return (
    <CatalogContext.Provider
      value={{
        products,
        categories: remote.categories,
        banners: remote.banners,
        loading,
        error,
        addProduct,
        deleteProduct,
        editProduct,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);

  if (!ctx) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }

  return ctx;
}
