import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

function setMeta(name, content, property = false) {
  const key = property ? 'property' : 'name';
  let node = document.head.querySelector(`meta[${key}="${name}"]`);
  if (!content) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(key, name);
    document.head.appendChild(node);
  }
  node.content = content;
}

function absoluteUrl(value, base) {
  if (!value) return '';
  try { return new URL(value, base).toString(); }
  catch { return ''; }
}

export default function Seo({ title, description, image, noindex = false, schema }) {
  const { data } = useSite();
  const { pathname } = useLocation();
  useEffect(() => {
    const defaults = data?.settings?.seo || {};
    const finalTitle = title || defaults.title || 'MacLuck';
    const finalDescription = description || defaults.description || '';
    const base = defaults.publicUrl || window.location.origin;
    const canonical = absoluteUrl(pathname, base) || window.location.href;
    document.title = finalTitle;
    setMeta('description', finalDescription);
    setMeta('robots', noindex ? 'noindex,nofollow' : 'index,follow');
    setMeta('og:title', finalTitle, true);
    setMeta('og:description', finalDescription, true);
    setMeta('og:url', canonical, true);
    setMeta('og:type', 'website', true);
    setMeta('og:image', absoluteUrl(image, base), true);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = canonical;
    let script = document.getElementById('page-schema');
    if (schema) {
      if (!script) { script = document.createElement('script'); script.id = 'page-schema'; script.type = 'application/ld+json'; document.head.appendChild(script); }
      script.textContent = JSON.stringify(schema);
    } else script?.remove();
  }, [data, description, image, noindex, pathname, schema, title]);
  return null;
}
