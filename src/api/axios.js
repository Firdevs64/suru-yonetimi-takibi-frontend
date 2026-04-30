import axios from 'axios';

// Backend çalıştığında URL'i buraya göre ayarlayabilirsiniz.
// Geliştirme aşamasında .NET projeniz genelde localhost:5000 veya benzeri çalışır.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:7121/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000, // 8 saniye içinde cevap gelmezse hata fırlat
});

api.interceptors.request.use(
  (config) => {
    // İleride yetkilendirme (Token) eklenecekse burası kullanılır
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API İsteği Hatası:', error);
    return Promise.reject(error);
  }
);

export default api;
