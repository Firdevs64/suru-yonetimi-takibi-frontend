import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { Alert } from 'react-native';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
  }, []);

  async function loadStorageData() {
    try {
      const authDataSerialized = await AsyncStorage.getItem('@AuthData');
      if (authDataSerialized) {
        const _authData = JSON.parse(authDataSerialized);
        setUser(_authData);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  const login = async (email, password) => {
    try {
      // Önce Bakım Modu Kontrolü
      const settingsRes = await api.get('/Settings');
      const isAdmin = email.toLowerCase() === 'firdevs6452@gmail.com';
      
      if (settingsRes.data.maintenanceMode && !isAdmin) {
        throw new Error('Sistem şu an bakım modundadır. Lütfen daha sonra tekrar deneyiniz.');
      }

      const response = await api.post('/Users/login', { email, password });
      
      const userData = response.data;
      setUser(userData);
      await AsyncStorage.setItem('@AuthData', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Giriş yapılamadı.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@AuthData');
  };

  const registerUser = async (userData) => {
    try {
      const response = await api.post('/Users/register', {
        fullName: userData.name, // RegisterScreen sends 'name'
        email: userData.email,
        password: userData.password,
        phone: userData.phone
      });
      
      const authData = response.data;
      setUser(authData);
      await AsyncStorage.setItem('@AuthData', JSON.stringify(authData));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Kayıt işlemi başarısız.';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerUser, isAdmin: user?.role === 'Sistem Yöneticisi' }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
