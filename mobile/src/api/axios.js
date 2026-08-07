import axios from 'axios';
import { Platform } from 'react-native';

// Android Emülatöründe 'localhost' 10.0.2.2'dir. 
// Gerçek cihazda test edecekseniz bilgisayarınızın yerel IP adresini (örn: 192.168.1.50) yazmalısınız.
const baseURL = 'http://suru-api.runasp.net/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Hatası (Mobil):', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
