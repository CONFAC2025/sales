import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import OrganizationPage from './pages/OrganizationPage';
import CustomersPage from './pages/CustomersPage';
import CreateCustomerPage from './pages/CreateCustomerPage';
import EditCustomerPage from './pages/EditCustomerPage';
import ChatPage from './pages/ChatPage';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/admin/users" element={<AdminPage />} />
          <Route path="/admin/organization" element={<OrganizationPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/new" element={<CreateCustomerPage />} />
          <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
