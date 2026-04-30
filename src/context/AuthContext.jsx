import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Global Sistem Ayarları
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    stopNewRegistrations: false
  });

  // Uygulama açıldığında localStorage'dan kullanıcıyı ve ayarları yükle
  useEffect(() => {
    const storedUser = localStorage.getItem('sistem_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const storedSettings = localStorage.getItem('sistem_settings');
    if (storedSettings) {
      setSystemSettings(JSON.parse(storedSettings));
    }
  }, []);

  // Giriş Fonksiyonu (C# Backend Bağlantılı)
  const login = async (credentials) => {
    try {
      const isAdmin = credentials.email?.toLowerCase() === 'firdevs6452@gmail.com';

      // Bakım Modu Kontrolü
      if (systemSettings.maintenanceMode && !isAdmin) {
        return { success: false, message: 'Sistem şu an bakım modundadır. Sadece yöneticiler giriş yapabilir.' };
      }

      // Backend'e giriş isteği at
      const res = await api.post('/Users/login', {
        email: credentials.email,
        password: credentials.password
      });

      const userData = {
        userId: res.data.userId,
        name: res.data.fullName || res.data.name,
        email: res.data.email,
        phone: res.data.phone || '0543 877 8860',
        role: res.data.role
      };

      setUser(userData);
      localStorage.setItem('sistem_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      console.error('Login hatası:', err);
      const errorMsg = err.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      return { success: false, message: errorMsg };
    }
  };

  // Yeni Kayıt Fonksiyonu (C# Backend Bağlantılı)
  const registerUser = async (userData) => {
    if (systemSettings.stopNewRegistrations) {
      return { success: false, message: 'Sistem Yöneticisi şu an yeni kayıtlara izin vermiyor.' };
    }

    try {
      // Backend'e kayıt isteği at
      const res = await api.post('/Users/register', {
        fullName: userData.fullName || userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone || ''
      });

      // Kayıt başarılıysa otomatik giriş yap
      const authUser = {
        userId: res.data.userId,
        name: res.data.fullName,
        email: res.data.email,
        phone: res.data.phone,
        role: res.data.role
      };

      setUser(authUser);
      localStorage.setItem('sistem_user', JSON.stringify(authUser));
      return { success: true };
    } catch (err) {
      console.error('Register hatası:', err);
      const errorMsg = err.response?.data?.message || 'Kayıt başarısız. Bu e-posta adresi kullanımda olabilir.';
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sistem_user');
  };

  // Profil Güncelleme
  const updateProfile = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('sistem_user', JSON.stringify(newUser));

    // Mock DB'de de bu kullanıcının bilgilerini güncelle (Böylece tekrar giriş yaptığında güncel bilgiler gelir)
    const storedUsers = JSON.parse(localStorage.getItem('sistem_users_db') || '[]');
    const userIndex = storedUsers.findIndex(u => u.email === newUser.email);
    if (userIndex !== -1) {
      storedUsers[userIndex] = newUser;
    } else {
      storedUsers.push(newUser);
    }
    localStorage.setItem('sistem_users_db', JSON.stringify(storedUsers));
  };

  // Kullanıcı Silme Fonksiyonu
  const deleteUser = async (userId) => {
    try {
      await api.delete(`/Users/${userId}`);
      return { success: true };
    } catch (err) {
      console.error('Kullanıcı silme hatası:', err);
      return { success: false, message: 'Kullanıcı silinemedi.' };
    }
  };

  // Sistem Ayarlarını Güncelleme Fonksiyonu
  const updateSystemSettings = (newSettings) => {
    const updated = { ...systemSettings, ...newSettings };
    setSystemSettings(updated);
    localStorage.setItem('sistem_settings', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user, login, logout, updateProfile, registerUser, deleteUser,
      systemSettings, updateSystemSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
};
