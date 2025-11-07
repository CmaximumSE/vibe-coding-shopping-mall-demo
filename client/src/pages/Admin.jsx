import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../components/admin/Dashboard';
import ProductList from './admin/ProductList';
import ProductCreate from './admin/ProductCreate';
import ProductEdit from './admin/ProductEdit';
import OrderList from './admin/OrderList';

const Admin = () => {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/create" element={<ProductCreate />} />
        <Route path="products/:id/edit" element={<ProductEdit />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="users" element={<div className="p-6"><h1 className="text-2xl font-bold">회원 관리</h1></div>} />
      </Routes>
    </AdminLayout>
  );
};

export default Admin;
