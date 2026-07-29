import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BannerSlider({ banners }) {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((i) => (i + 1) % banners.length);
  const prev = () => setCurrent((i) => (i - 1 + banners.length) % banners.length);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => setCurrent((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg">
      <div className="relative aspect-[3/1] sm:aspect-[4/1] max-h-[280px] min-h-[120px]">
        {banners.map((banner, idx) => (
          <Link
            key={banner.id}
            to={banner.link}
            className={`absolute inset-0 transition-opacity duration-700 bg-gradient-to-br ${banner.gradient} ${
              idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {banner.image_url && (
              <img src={banner.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div
              className={`absolute right-[8%] top-1/2 -translate-y-1/2 w-32 h-32 sm:w-44 sm:h-44 rounded-full ${banner.circle_color} hidden sm:block ${banner.image_url ? 'opacity-0' : ''}`}
            />
            <div className="absolute right-[20%] top-[20%] w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 hidden sm:block" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-12 sm:px-20 pb-6 sm:pb-8">
              <h2 className="text-white font-black text-lg sm:text-3xl md:text-4xl leading-tight drop-shadow-md">
                {banner.title}
              </h2>
              <p className="text-white/80 text-xs sm:text-base md:text-lg mt-1 sm:mt-2 leading-snug">
                {banner.subtitle}
              </p>
              <p className="text-white/90 text-[10px] sm:text-sm md:text-base font-semibold mt-2 sm:mt-4 leading-snug">
                {banner.footer}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition"
          >
            <ChevronLeft size={18} className="text-white sm:hidden" />
            <ChevronLeft size={24} className="text-white hidden sm:block" />
          </button>
          <button
            onClick={next}
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition"
          >
            <ChevronRight size={18} className="text-white sm:hidden" />
            <ChevronRight size={24} className="text-white hidden sm:block" />
          </button>
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-1.5 sm:h-2 rounded-full transition-all ${
                  idx === current ? 'w-6 sm:w-8 bg-white' : 'w-1.5 sm:w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
