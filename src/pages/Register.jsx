import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Phone, Activity, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { registerUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.email && formData.password && formData.name && formData.phone) {
      const response = await registerUser({
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        password: formData.password
      });

      if (response.success) {
        navigate('/');
      } else {
        setError(response.message);
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

      {/* Sağ Taraf - Kayıt Formu */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-10 bg-[#fafafa]">
        <div className="w-full max-w-[500px] bg-white p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-gray-100/50">
          
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 flex items-center justify-center transition-transform hover:scale-105 duration-500">
                <img src="/logo.png" alt="Sürü Yönetim Sistemi Logo" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-[#1d1d1f] tracking-tighter mb-1">Sürü Yönetimi</h2>
            <p className="text-gray-400 font-bold text-[10px] tracking-[0.3em] uppercase">Yeni Hesap Aç</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-3xl text-sm font-bold text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Ad Soyad */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 ml-1 uppercase tracking-widest">Ad Soyad</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#0081C9] transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[#1d1d1f] placeholder-gray-300 focus:bg-white focus:outline-none focus:border-[#4ca02e] transition-all font-bold text-base"
                  placeholder="İsminiz"
                  required
                />
              </div>
            </div>

            {/* E-posta */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 ml-1 uppercase tracking-widest">E-posta</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#0081C9] transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[#1d1d1f] placeholder-gray-300 focus:bg-white focus:outline-none focus:border-[#4ca02e] transition-all font-bold text-base"
                  placeholder="ornek@ciftlik.com"
                  required
                />
              </div>
            </div>

            {/* Telefon */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 ml-1 uppercase tracking-widest">Telefon</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#0081C9] transition-colors">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[#1d1d1f] placeholder-gray-300 focus:bg-white focus:outline-none focus:border-[#4ca02e] transition-all font-bold text-base"
                  placeholder="0555 123 4567"
                  required
                />
              </div>
            </div>

            {/* Şifre */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-400 ml-1 uppercase tracking-widest">Şifre</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-[#0081C9] transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-14 pr-14 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-[#1d1d1f] placeholder-gray-300 focus:bg-white focus:outline-none focus:border-[#4ca02e] transition-all font-bold text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-300 hover:text-[#4ca02e] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-4 bg-[#4ca02e] hover:bg-[#3d8325] text-white font-black py-5 px-10 rounded-2xl shadow-2xl shadow-[#4ca02e]/20 transform hover:-translate-y-1 transition-all mt-6 text-lg"
            >
              <span>Hesap Oluştur</span>
              <UserPlus className="h-6 w-6" />
            </button>
          </form>

          <div className="mt-8 text-center text-gray-400 font-bold text-xs">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-[#4ca02e] hover:underline underline-offset-8 decoration-[2px]">
              Giriş Yapın
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
