import React, { useEffect, useState } from 'react';
import { Users, Activity, Database, Server, TrendingUp, ShieldCheck, Clock, Settings, Power, ShieldAlert, Cpu, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../api/axios';

const AdminDashboard = () => {
  const { user, systemSettings, updateSystemSettings } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, farmers: 0 });
  const [recentActivities, setRecentActivities] = useState([]);
  const [animalData, setAnimalData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  // Sahte (Mock) Veriler - Grafikler için şimdilik kalsın veya boşaltılabilir
  const monthlyData = [
    { name: 'Oca', kayitlar: 0 },
    { name: 'Şub', kayitlar: 0 },
    { name: 'Mar', kayitlar: 0 },
    { name: 'Nis', kayitlar: 0 },
    { name: 'May', kayitlar: 0 },
    { name: 'Haz', kayitlar: 1 },
  ];

  useEffect(() => {
    // Sadece Sistem Yöneticisi görebilir
    if (user?.role !== 'Sistem Yöneticisi') {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/admin/stats');
        setStats({
          totalUsers: res.data.totalUsers,
          farmers: res.data.farmers
        });
        setRecentActivities(res.data.recentActivities);
        setAnimalData(res.data.animalDistribution);
      } catch (err) {
        console.error('Admin stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Karşılama */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sistem Özeti</h1>
          <p className="text-gray-500 mt-2">Sistemin genel durumu, metrikler ve son aktiviteler.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <span className="text-sm font-semibold text-gray-700">Tüm Sistemler Aktif</span>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:border-primary-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500">Toplam Kullanıcı</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</h3>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              +%12 bu ay
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:border-primary-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500">Kayıtlı Çiftlik</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.farmers}</h3>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" />
              +%5 bu ay
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:border-primary-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500">Sunucu Durumu</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-2">%99.9</h3>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1 font-medium">
              <Activity className="w-3 h-3" />
              Kesintisiz çalışıyor
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Server className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:border-primary-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500">Sistem Güvenliği</p>
            <h3 className="text-xl font-bold text-gray-900 mt-3">Maksimum</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Son tarama: Bugün</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grafikler Alanı */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Çizgi Grafik: Büyüme */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Aylık Yeni Kayıt İvmesi</h2>
            <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option>Bu Yıl</option>
              <option>Geçen Yıl</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKayitlar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
                <Area type="monotone" dataKey="kayitlar" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorKayitlar)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pasta Grafik: Sürü Dağılımı */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Genel Hayvan Dağılımı</h2>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={animalData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {animalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#111827', fontWeight: '500' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Efsane (Legend) */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {animalData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-600 font-medium">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Alt Kısım: Sistem Kaynakları & Aktiviteler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sistem Kaynakları */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Sistem Kaynakları
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-gray-600 flex items-center gap-1.5"><Cpu className="w-4 h-4"/> CPU Kullanımı</span>
                <span className="text-gray-900">%42</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-gray-600 flex items-center gap-1.5"><HardDrive className="w-4 h-4"/> RAM Tüketimi</span>
                <span className="text-gray-900">%65</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-gray-600 flex items-center gap-1.5"><Database className="w-4 h-4"/> Veritabanı Doluluğu</span>
                <span className="text-gray-900">%12</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Son Aktiviteler */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              Son Aktiviteler
            </h2>
            <button 
              onClick={() => navigate('/admin/activities')}
              className="text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              Tümünü Gör
            </button>
          </div>

          <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {recentActivities.map((act) => (
              <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                  {act.type === 'user' && <Users className="w-4 h-4 text-blue-500" />}
                  {act.type === 'system' && <Server className="w-4 h-4 text-purple-500" />}
                  {act.type === 'security' && <ShieldAlert className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm group-hover:border-primary-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-400">{act.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{act.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>

      {/* Hızlı Ayarlar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          Hızlı Kontroller
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div 
            onClick={() => updateSystemSettings({ maintenanceMode: !systemSettings.maintenanceMode })}
            className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer select-none group"
          >
            <div>
              <p className="font-semibold text-gray-800 text-sm group-hover:text-primary-600 transition-colors">Bakım Modu</p>
              <p className="text-xs text-gray-400 mt-0.5">Sistemi dışa kapat</p>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${systemSettings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}>
              <div className={`absolute top-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-all ${systemSettings.maintenanceMode ? 'left-[22px]' : 'left-[2px]'}`}></div>
            </div>
          </div>

          <div 
            onClick={() => updateSystemSettings({ stopNewRegistrations: !systemSettings.stopNewRegistrations })}
            className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer select-none group"
          >
            <div>
              <p className="font-semibold text-gray-800 text-sm group-hover:text-primary-600 transition-colors">Yeni Kayıtlar</p>
              <p className="text-xs text-gray-400 mt-0.5">{systemSettings.stopNewRegistrations ? 'Durduruldu' : 'Aktif'}</p>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${systemSettings.stopNewRegistrations ? 'bg-red-500' : 'bg-green-500'}`}>
              <div className={`absolute top-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-all ${systemSettings.stopNewRegistrations ? 'left-[22px]' : 'left-[2px]'}`}></div>
            </div>
          </div>

          <div 
            onClick={() => {
              if(isBackingUp) return;
              setIsBackingUp(true);
              setBackupSuccess(false);
              setTimeout(() => {
                setIsBackingUp(false);
                setBackupSuccess(true);
                setTimeout(() => setBackupSuccess(false), 3000);
              }, 2000);
            }}
            className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer select-none group"
          >
            <div>
              <p className="font-semibold text-gray-800 text-sm group-hover:text-primary-600 transition-colors">Sistem Yedeği</p>
              <p className="text-xs mt-0.5 min-h-[16px]">
                {isBackingUp ? (
                  <span className="text-blue-500 flex items-center gap-1"><Server className="w-3 h-3 animate-spin"/> Yedekleniyor...</span>
                ) : backupSuccess ? (
                  <span className="text-green-500 font-medium">Başarılı!</span>
                ) : (
                  <span className="text-gray-400">Şimdi Manuel Al</span>
                )}
              </p>
            </div>
            <div className={`p-2 rounded-lg transition-colors ${backupSuccess ? 'bg-green-100 text-green-600' : isBackingUp ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600'}`}>
              <Database className="w-5 h-5" />
            </div>
          </div>

          <button onClick={() => navigate('/admin/users')} className="flex items-center justify-center gap-2 p-4 border border-primary-100 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors font-semibold text-sm select-none">
            <Users className="w-4 h-4" />
            Tüm Kullanıcıları Gör
          </button>

        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
