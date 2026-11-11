import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ChatBot from './components/ChatBot.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Contact from './pages/Contact.jsx';
import Admin from './pages/Admin.jsx';
import Help from './pages/Help.jsx';
import Info from './pages/Info.jsx';
import Track from './pages/Track.jsx';
import Account from './pages/Account.jsx';
import ProductPage from './pages/ProductPage.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmation from './pages/OrderConfirmation.jsx';
import BagDrawer from './components/BagDrawer.jsx';
import { CartProvider } from './context/CartContext.jsx';

export default function App() {
  // El panel de administración usa un tema oscuro propio (estilo Dovetail)
  const admin = useLocation().pathname.startsWith('/admin');
  return (
    <CartProvider>
      <ScrollToTop />
      <Navbar />
      <main className={admin ? 'admin-theme' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/producto/:id" element={<ProductPage />} />
          <Route path="/pago" element={<Checkout />} />
          <Route path="/pedido/:code" element={<OrderConfirmation />} />
          <Route path="/ayuda" element={<Help />} />
          <Route path="/info/:slug" element={<Info />} />
          <Route path="/rastreo" element={<Track />} />
          <Route path="/cuenta" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <BagDrawer />
      <ChatBot />
    </CartProvider>
  );
}
