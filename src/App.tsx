import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { MerchantPage } from './pages/MerchantPage';
import { CustomerPage } from './pages/CustomerPage';
import { CheckoutPage, OrderListPage } from './pages/CheckoutPage';
import { DishDetailPage } from './pages/DishDetailPage';

const CommentsPage = lazy(() => import('./pages/CommentsPage').then((module) => ({ default: module.CommentsPage })));

function CommentsRoute() {
  return <Suspense fallback={<p role="status" className="mx-auto max-w-[480px] bg-white p-5 text-sm text-neutral-500">加载评论中…</p>}><CommentsPage /></Suspense>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/merchant" replace />} />
      <Route path="/merchant" element={<MerchantPage />} />
      <Route path="/m/:storeId" element={<CustomerPage />} />
      <Route path="/m/:storeId/dish/:dishId" element={<DishDetailPage />} />
      <Route path="/m/:storeId/checkout" element={<CheckoutPage />} />
      <Route path="/m/:storeId/orders" element={<OrderListPage />} />
      <Route path="/m/:storeId/comments" element={<CommentsRoute />} />
      <Route path="/m/:storeId/comments/dish/:dishId" element={<CommentsRoute />} />
      <Route path="*" element={<Navigate to="/merchant" replace />} />
    </Routes>
  );
}
