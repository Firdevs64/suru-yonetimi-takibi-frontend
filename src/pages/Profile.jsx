import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, Shield, Camera, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || ''
  });
  const fileInputRef = useRef(null);

  // Eğer user değişirse formu da güncelle
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || ''
      });
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // FileReader ile resmi önizleme olarak gösteriyoruz
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

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ ...formData, profileImage });
    
    setSuccessMessage('Profil başarıyla güncellendi!');
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profilim</h1>
        <p className="text-gray-500 mt-1">Kişisel bilgilerinizi ve hesap tercihlerinizi yönetin.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Üst Kısım - Banner ve Fotoğraf */}
        <div className="relative h-48 bg-gradient-to-r from-primary-600 to-primary-400">
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden flex items-center justify-center shadow-lg">
                {profileImage ? (
                  <img src={profileImage} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-300" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md text-primary-600 hover:text-primary-700 hover:bg-gray-50 transition-colors border border-gray-100"
                title="Fotoğrafı Değiştir"
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
        </div>

        {/* Form Kısmı */}
        <div className="pt-20 px-8 pb-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* İsim Soyisim */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Soyad</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
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
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white"
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
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Rol (Sadece Okunabilir) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Görev/Rol</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    readOnly
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-gray-500 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Rolünüzü yalnızca sistem yöneticileri değiştirebilir.</p>
              </div>

            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <div>
                {successMessage && (
                  <p className="text-green-600 font-medium text-sm animate-pulse">
                    {successMessage}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-500/30"
              >
                <Save className="w-5 h-5" />
                <span>Değişiklikleri Kaydet</span>
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
