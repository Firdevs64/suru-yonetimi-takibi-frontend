import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    stopNewRegistrations: false
  });

  // Uygulama açıldığında verileri yükle
  useEffect(() => {
    const storedUser = localStorage.getItem('sistem_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/Settings');
      setSystemSettings(res.data);
    } catch (err) {
      console.error('Settings fetch error:', err);
    }
  };

  const login = async (credentials) => {
    try {
      // Önce Backend'den güncel Bakım Modu'nu çek ve kontrol et
      const settingsRes = await api.get('/Settings');
      const isAdmin = credentials.email?.toLowerCase() === 'firdevs6452@gmail.com';

      if (settingsRes.data.maintenanceMode && !isAdmin) {
        return { success: false, message: 'Sistem şu an bakım modundadır. Sadece yöneticiler giriş yapabilir.' };
      }

      // Backend'e giriş isteği at
      const res = await api.post('/Users/login', {
        email: credentials.email,
        password: credentials.password
      });

      const userData = res.data;
      setUser(userData);
      localStorage.setItem('sistem_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sistem_user');
  };

  const updateSystemSettings = async (newSettings) => {
    try {
      const res = await api.put('/Settings', { ...systemSettings, ...newSettings });
      setSystemSettings(res.data);
      return { success: true };
    } catch (err) {
      console.error('Update settings error:', err);
      return { success: false };
    }
  };

  const registerUser = async (userData) => {
    // Kayıt öncesi durdurma kontrolü
    const settingsRes = await api.get('/Settings');
    if (settingsRes.data.stopNewRegistrations) {
      return { success: false, message: 'Sistem Yöneticisi şu an yeni kayıtlara izin vermiyor.' };
    }

    try {
      const res = await api.post('/Users/register', {
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone || ''
      });

      setUser(res.data);
      localStorage.setItem('sistem_user', JSON.stringify(res.data));
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                       (err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : 'Kayıt başarısız.');
      return { success: false, message: errorMsg };
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      // Backend'e gönderilecek veriyi hazırla (backend expects userId, phone, vetName, vetPhone)
      await api.put('/Users/profile', {
        userId: user.userId,
        phone: updatedData.phone,
        vetName: updatedData.vetName,
        vetPhone: updatedData.vetPhone
      });

      const newUser = { ...user, ...updatedData };
      setUser(newUser);
      localStorage.setItem('sistem_user', JSON.stringify(newUser));
      return { success: true };
    } catch (err) {
      console.error('Profil güncelleme hatası:', err);
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, registerUser, updateProfile,
      systemSettings, updateSystemSettings, fetchSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
};
