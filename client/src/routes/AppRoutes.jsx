import { Routes, Route } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// 페이지 컴포넌트들
import Home from '../pages/Home';
import MainPage from '../pages/MainPage';
import Products from '../pages/Products';
import ProductDetail from '../pages/ProductDetail';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import Orders from '../pages/Orders';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import CheckoutSuccess from '../pages/CheckoutSuccess';
import CheckoutFailure from '../pages/CheckoutFailure';
import Admin from '../pages/Admin';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 공개 라우트 */}
        <Route index element={<MainPage />} />
        <Route path="home" element={<Home />} />
        <Route path="main" element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        } />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="cart" element={<Cart />} />
        
        {/* 보호된 라우트 */}
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="orders/:id" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="checkout" element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        } />
        <Route path="checkout/success" element={
          <ProtectedRoute>
            <CheckoutSuccess />
          </ProtectedRoute>
        } />
        <Route path="checkout/failure" element={
          <ProtectedRoute>
            <CheckoutFailure />
          </ProtectedRoute>
        } />
        
        {/* 관리자 라우트 */}
        <Route path="admin/*" element={
          <ProtectedRoute requireAdmin>
            <Admin />
          </ProtectedRoute>
        } />
        
        {/* 404 페이지 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
