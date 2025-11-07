import { Outlet, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header userInfo={user} onLogout={handleLogout} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
