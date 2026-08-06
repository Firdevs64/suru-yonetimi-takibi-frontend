import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, Shield, Camera, Save, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.fullName || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role === 'User' ? 'Çiftçi' : user?.role || '',
    vetName: user?.vetName || '',
    vetPhone: user?.vetPhone || ''
  });
  const fileInputRef = useRef(null);

  const isAdmin = user?.email === 'firdevs6452@gmail.com';

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role === 'User' ? 'Çiftçi' : user.role || '',
        vetName: user.vetName || '',
        vetPhone: user.vetPhone || ''
      });
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    
    const res = await updateProfile({ ...formData, profileImage });
    
    if (res.success) {
      setSuccessMessage('Profil ve veteriner bilgileriniz başarıyla güncellendi!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage('Güncelleme sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profilim</h1>
        <p className="text-gray-500 mt-1">Kişisel bilgilerinizi ve hesap tercihlerinizi yönetin.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Üst Kısım - Banner ve Fotoğraf */}
        <div className={`relative h-48 bg-gradient-to-r ${isAdmin ? 'from-amber-500 to-amber-300' : 'from-primary-600 to-primary-400'}`}>
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden flex items-center justify-center shadow-lg">
                {profileImage ? (
                  <img src={profileImage} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isAdmin ? 'bg-amber-100 text-amber-600' : 'bg-primary-50 text-primary-600'}`}>
                    <span className="text-4xl font-bold">{formData.name?.charAt(0)}</span>
                  </div>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md text-primary-600 hover:text-primary-700 hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>
          <div className="absolute bottom-4 left-44">
             <h2 className="text-2xl font-bold text-white drop-shadow-md">{formData.name}</h2>
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>
               {formData.role}
             </span>
          </div>
        </div>

        {/* Form Kısmı */}
        <div className="pt-20 px-8 pb-8">
          <form onSubmit={handleSave} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* İsim Soyisim */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Soyad</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* E-Posta */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">E-posta Adresi</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-500 bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon Numarası</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05xx xxx xx xx"
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sistem Unvanı</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.role}
                    readOnly
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-500 bg-gray-100 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Veteriner Bölümü (Sadece Çiftçiler İçin) */}
            {!isAdmin && (
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900">Veteriner Bilgilerim</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-emerald-800 mb-2">Veteriner Adı Soyadı</label>
                    <input
                      type="text"
                      name="vetName"
                      value={formData.vetName}
                      onChange={handleChange}
                      placeholder="Örn: Dr. Ahmet Yılmaz"
                      className="block w-full px-4 py-3 border border-emerald-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-emerald-800 mb-2">Veteriner Telefonu</label>
                    <input
                      type="tel"
                      name="vetPhone"
                      value={formData.vetPhone}
                      onChange={handleChange}
                      placeholder="Hızlı arama için telefon numarası"
                      className="block w-full px-4 py-3 border border-emerald-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <div>
                {successMessage && <p className="text-emerald-600 font-bold text-sm animate-bounce">✓ {successMessage}</p>}
                {errorMessage && <p className="text-red-600 font-bold text-sm">✗ {errorMessage}</p>}
              </div>
              <button
                type="submit"
                className={`flex items-center gap-2 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md focus:outline-none focus:ring-4 ${isAdmin ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/30' : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500/30'}`}
              >
                <Save className="w-5 h-5" />
                <span>Profili Güncelle</span>
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
