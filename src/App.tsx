import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import CreatePassword from './pages/CreatePassword';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/AdminUsers';
import { isAuthenticated } from './lib/api';

// Layout base modernizado
const BaseLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-900 text-slate-50">
    <header className="glass border-b border-white/10 shadow-glass">
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-xl font-bold gradient-text">
          MCP Auth
        </h1>
      </div>
    </header>
    
    <main className="flex-1">
      <Outlet />
    </main>
    
    <footer className="glass border-t border-white/10 py-4">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs text-slate-400">
          &copy; 2026 MCP • Todos los derechos reservados
        </p>
      </div>
    </footer>
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
