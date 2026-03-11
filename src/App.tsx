import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import CreatePassword from './pages/CreatePassword';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/AdminUsers';
import { isAuthenticated } from './lib/api';

// Layout base reutilizable
const BaseLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <header className="bg-gray-800 text-white p-4">MCP Auth</header>
    <main className="flex-1 p-4">
      <Outlet />
    </main>
    <footer className="bg-gray-100 text-center p-2 text-xs">&copy; 2026 MCP</footer>
  </div>
);

// Ruta privada
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<BaseLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/create-password" element={<CreatePassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute>
                <AdminUsers />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
