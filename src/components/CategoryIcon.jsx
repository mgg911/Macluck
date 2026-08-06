import { useEffect, useState } from 'react';

export default function CategoryIcon({ category, className = '' }) {
  const [failed, setFailed] = useState(false);
  const logo = String(category?.logo || '').trim();

  useEffect(() => {
    setFailed(false);
  }, [logo]);

  return (
    <div className={`rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden ${className}`}>
      {logo && !failed ? (
        <img
          src={logo}
          alt=""
          className="w-full h-full object-contain p-2"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-2xl font-bold text-brand-600">{category?.name?.[0] || '?'}</span>
      )}
    </div>
  );
}
