import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { CatalogProvider } from './context/CatalogContext';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import BrandPage from './pages/BrandPage';
import Clearance from './pages/Clearance';
import Favorites from './pages/Favorites';
import SearchPage from './pages/Search';
import CartPage from './pages/CartPage';
import NewsPage from './pages/NewsPage';
import NewsArticle from './pages/NewsArticle';
import AdminPage from './pages/AdminPage';
import ContentPage from './pages/ContentPage';
import NotFound from './pages/NotFound';
import { SiteProvider } from './context/SiteContext';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SiteProvider>
       <CatalogProvider>
        <CartProvider>
          <FavoritesProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/clearance" element={<Clearance />} />
                  <Route path="/brand/:brand" element={<BrandPage />} />
                  <Route path="/category/:brand/:subcategory" element={<BrandPage />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/news/:id" element={<NewsArticle />} />
                  <Route path="/admin/*" element={<AdminPage />} />
                  <Route path="/about" element={<ContentPage type="about" />} />
                  <Route path="/delivery" element={<ContentPage type="delivery" />} />
                  <Route path="/privacy" element={<ContentPage legalSlug="privacy" />} />
                  <Route path="/terms" element={<ContentPage legalSlug="terms" />} />
                  <Route path="/cookies" element={<ContentPage legalSlug="cookies" />} />
                  <Route path="/consent" element={<ContentPage legalSlug="consent" />} />
                  <Route path="/legal/:slug" element={<ContentPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <CartDrawer />
            </div>
          </FavoritesProvider>
        </CartProvider>
       </CatalogProvider>
      </SiteProvider>
    </BrowserRouter>
  );
}
