import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Shield, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, deleteUser } = useAuth();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/Users');
      console.log('Fetched Users:', res.data);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Kullanıcıları getirme hatası:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Güvenlik kontrolü: Sadece Sistem Yöneticisi girebilir
    if (user?.role !== 'Sistem Yöneticisi') {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [user, navigate]);

  // Arama filtresi
  const filteredUsers = users.filter(u => 
    (u.fullName || u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone || '').includes(searchTerm)
  );

  const handleDelete = async (userId, userEmail) => {
    if (userEmail === user.email) {
      alert('Kendi hesabınızı silemezsiniz!');
      return;
    }
    
    if (window.confirm('Bu kullanıcıyı sistemden tamamen silmek istediğinize emin misiniz?')) {
      const res = await deleteUser(userId);
      if (res.success) {
        setUsers(users.filter(u => u.userId !== userId));
      } else {
        alert(res.message);
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Başlık ve Arama */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-600" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-gray-500 mt-2">Sisteme kayıtlı tüm çiftlik sahiplerini ve yöneticileri görüntüleyin.</p>
        </div>

        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="İsim, E-posta veya Telefon Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Kullanıcılar Tablosu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                <th className="p-5">Kullanıcı Bilgisi</th>
                <th className="p-5">İletişim</th>
                <th className="p-5">Rol</th>
                <th className="p-5 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    Kayıtlı kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    {/* Kullanıcı Bilgisi */}
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt={u.fullName || u.name} className="w-full h-full object-cover" />
                          ) : (
                            (u.fullName || u.name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.fullName || u.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* İletişim */}
                    <td className="p-5 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {u.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {u.phone || '-'}
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'Sistem Yöneticisi' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        {u.role || 'Çiftçi'}
                      </span>
                    </td>

                    {/* Durum & İşlemler */}
                    <td className="p-5 text-right space-x-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Aktif
                      </span>
                      
                      {u.email !== user.email && (
                        <button 
                          onClick={() => handleDelete(u.userId, u.email)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Kullanıcıyı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
