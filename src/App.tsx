import { Navigate, Route, Routes } from 'react-router-dom';

import { MerchantPage } from './pages/MerchantPage';
import { CustomerPage } from './pages/CustomerPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/merchant" replace />} />
      <Route path="/merchant" element={<MerchantPage />} />
      <Route path="/m/:storeId" element={<CustomerPage />} />
      <Route path="*" element={<Navigate to="/merchant" replace />} />
    </Routes>
  );
}
