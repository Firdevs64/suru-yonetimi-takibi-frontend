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
  // Arama filtresi (Hem küçük hem büyük harf gelen veriyi destekler)
  const filteredUsers = users.filter(u => {
    const name = u.fullName || u.FullName || u.name || u.Name || '';
    const email = u.email || u.Email || '';
    const phone = u.phone || u.Phone || '';

    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm);
  });


  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userAnimals, setUserAnimals] = useState({});
  const [fetchingAnimals, setFetchingAnimals] = useState(false);

  const fetchUserAnimals = async (userId) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    
    setFetchingAnimals(true);
    try {
      const res = await api.get(`/Animals?userId=${userId}`);
      setUserAnimals(prev => ({ ...prev, [userId]: res.data }));
      setExpandedUserId(userId);
    } catch (err) {
      console.error('Hayvanları getirme hatası:', err);
    } finally {
      setFetchingAnimals(false);
    }
  };

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`${email} kullanıcısı silinsin mi?`)) return;
    try {
      await api.delete(`/Users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Başlık ve Arama */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-4xl font-black text-gray-900 flex items-center gap-4 tracking-tight">
            <div className="bg-primary-100 p-3 rounded-2xl">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            Çiftçi Yönetimi
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Sisteme kayıtlı tüm çiftlik sahiplerini yönetin ve sürülerini inceleyin.</p>
        </div>

        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="İsim, E-posta veya Telefon Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 border border-gray-100 rounded-[1.5rem] bg-gray-50/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white focus:border-primary-500 transition-all font-bold text-sm"
          />
        </div>
      </div>

      {/* Kullanıcılar Listesi */}
      <div className="grid grid-cols-1 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-xl">Kayıtlı çiftçi bulunamadı.</p>
          </div>
        ) : (
          filteredUsers.map((u, index) => (
            <div key={index} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500">
              <div className="p-8 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5 flex-1 min-w-[300px]">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-primary-100 text-primary-600 flex items-center justify-center font-black text-2xl overflow-hidden shadow-inner">
                    {u.profileImage ? (
                      <img src={u.profileImage} alt={u.fullName} className="w-full h-full object-cover" />
                    ) : (
                      (u.fullName || u.name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{u.fullName || u.name}</h3>
                    <div className="flex flex-wrap gap-4 mt-2">
                       <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                         <Mail className="w-3.5 h-3.5" /> {u.email}
                       </span>
                       <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                         <Phone className="w-3.5 h-3.5" /> {u.phone || '-'}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {u.role !== 'Sistem Yöneticisi' && (
                    <>
                      <span className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
                        ÇİFTÇİ
                      </span>
                      
                      <button
                        onClick={() => fetchUserAnimals(u.userId)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all ${expandedUserId === u.userId ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-primary-600 hover:text-white'}`}
                      >
                        {fetchingAnimals && expandedUserId === u.userId ? 'Yükleniyor...' : (expandedUserId === u.userId ? 'Sürüyü Kapat' : 'Sürüyü İncele')}
                      </button>
                    </>
                  )}

                  {u.role === 'Sistem Yöneticisi' && (
                    <span className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-700">
                      SİSTEM YÖNETİCİSİ
                    </span>
                  )}
                  
                  {u.email !== user.email && u.role !== 'Sistem Yöneticisi' && (
                    <button
                      onClick={() => handleDelete(u.userId, u.email)}
                      className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Genişletilmiş Hayvan Listesi */}
              {expandedUserId === u.userId && (
                <div className="p-8 bg-gray-50 border-t border-gray-100 animate-slide-down">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Kayıtlı Hayvanlar ({userAnimals[u.userId]?.length || 0})</h4>
                    <div className="h-px bg-gray-200 flex-1 mx-6"></div>
                  </div>
                  
                  {userAnimals[u.userId]?.length === 0 ? (
                    <p className="text-center py-10 font-bold text-gray-400 italic">Bu çiftçiye ait henüz bir hayvan kaydı bulunamadı.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {userAnimals[u.userId]?.map((animal, ai) => (
                        <div key={ai} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-primary-300 transition-all group">
                          <p className="text-[10px] font-black text-primary-600 tracking-widest mb-1">{animal.tagNumber}</p>
                          <h5 className="font-black text-gray-900 text-lg group-hover:text-primary-600 transition-colors">{animal.name}</h5>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                            <span className="text-[10px] font-black text-gray-400 uppercase">{animal.type}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${animal.pregnancyStatus === 'Gebe' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {animal.pregnancyStatus || 'BOŞ'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
