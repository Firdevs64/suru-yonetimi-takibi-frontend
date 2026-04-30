import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { AlertTriangle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Animals from './pages/Animals';
import Reminders from './pages/Reminders';
import AIChat from './pages/AIChat';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminDashboard from './pages/AdminDashboard';
import AdminActivities from './pages/AdminActivities';

function App() {
  const { user, systemSettings } = useAuth();

  return (
    <>
      {systemSettings?.maintenanceMode && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium sticky top-0 z-[9999] shadow-md">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          SİSTEM BAKIM MODUNDA. Uygulama sadece yöneticilere açıktır.
        </div>
      )}
      <BrowserRouter>
      <Routes>
        {/* Giriş ve Kayıt ekranları Layout'tan bağımsız tam ekran çalışacak */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Diğer sayfalar Layout içinde - Sadece giriş yapmışsa */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="animals" element={<Animals />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="ai-chat" element={<AIChat />} />
          <Route path="profile" element={<Profile />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/activities" element={<AdminActivities />} />
        </Route>

        {/* Bilinmeyen rotaları anasayfaya veya login'e yönlendir */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
