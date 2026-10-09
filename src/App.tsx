import { Navigate, Route, Routes } from 'react-router-dom';

import { MerchantPage } from './pages/MerchantPage';
import { CustomerPage } from './pages/CustomerPage';
import { CheckoutPage, OrderListPage } from './pages/CheckoutPage';
import { DishDetailPage } from './pages/DishDetailPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/merchant" replace />} />
      <Route path="/merchant" element={<MerchantPage />} />
      <Route path="/m/:storeId" element={<CustomerPage />} />
      <Route path="/m/:storeId/dish/:dishId" element={<DishDetailPage />} />
      <Route path="/m/:storeId/checkout" element={<CheckoutPage />} />
      <Route path="/m/:storeId/orders" element={<OrderListPage />} />
      <Route path="*" element={<Navigate to="/merchant" replace />} />
    </Routes>
  );
}
