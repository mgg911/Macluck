// oxlint-disable react/only-export-components
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const refresh = () => api('/public').then(setData).catch((e) => setError(e.message));
  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!data?.settings?.favicon) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = data.settings.favicon;
  }, [data]);

  return <SiteContext.Provider value={{ data, error, refresh }}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext) || { data: null, error: '', refresh: () => {} };
}
