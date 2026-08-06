import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Activity, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log("Giriş denemesi yapılıyor:", { email, password }); // HATA AYIKLAMA
    
    if (email && password) {
      const response = await login({ email, password });
      console.log("Giriş cevabı:", response); // HATA AYIKLAMA
      
      if (response.success) {
        if (email.toLowerCase() === 'firdevs6452@gmail.com') {
          navigate('/admin/users');
        } else {
          navigate('/');
        }
      } else {
        setError(response.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">
      
      {/* Sol Taraf - Sanatsal Görsel Alanı (Görseliniz zaten yazılı olduğu için burası sade) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[30s] hover:scale-110"
          style={{ backgroundImage: `url('/login.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      </div>

      {/* Sağ Taraf - Minimalist Premium Kart */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-12 bg-[#fafafa]">
        <div className="w-full max-w-[480px] bg-white p-14 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-gray-100/50">
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-36 h-36 flex items-center justify-center transition-transform hover:scale-105 duration-500">
                <img src="/logo.png" alt="Sürü Yönetim Sistemi Logo" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
            <h2 className="text-[2rem] font-black text-[#1d1d1f] tracking-tighter mb-1">Sürü Yönetimi</h2>
            <p className="text-gray-400 font-bold text-xs tracking-[0.2em] uppercase">Hoş Geldiniz</p>
          </div>

          {error && (
            <div className="mb-10 p-5 bg-red-50 text-red-600 rounded-3xl text-sm font-bold text-center border border-red-100 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[13px] font-black text-gray-400 ml-1 uppercase tracking-widest">E-posta</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#4ca02e] transition-colors">
                  <Mail className="h-6 w-6" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-16 pr-6 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] text-[#1d1d1f] placeholder-gray-300 focus:bg-white focus:outline-none focus:border-[#4ca02e] transition-all font-bold text-lg"
                  placeholder="ornek@ciftlik.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[13px] font-black text-gray-400 ml-1 uppercase tracking-widest">Şifre</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#4ca02e] transition-colors">
                  <Lock className="h-6 w-6" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-16 pr-16 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] text-[#1d1d1f] placeholder-gray-300 focus:bg-white focus:outline-none focus:border-[#4ca02e] transition-all font-bold text-lg"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-6 flex items-center text-gray-300 hover:text-[#4ca02e] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-4 bg-[#4ca02e] hover:bg-[#3d8325] text-white font-black py-6 px-10 rounded-[2rem] shadow-2xl shadow-[#4ca02e]/20 transform hover:-translate-y-1.5 transition-all mt-10 text-xl"
            >
              <span>Giriş Yap</span>
              <ArrowRight className="h-7 w-7" />
            </button>
          </form>

          <div className="mt-14 text-center text-gray-400 font-bold text-sm">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="text-[#4ca02e] hover:underline underline-offset-8 decoration-[3px]">
              Hemen Kaydolun
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
