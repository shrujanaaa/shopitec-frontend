import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SpinWheel  from './pages/SpinWheel';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<SpinWheel  />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*"      element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
