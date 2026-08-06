import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity, PlusCircle, CheckCircle, AlertCircle, Droplets,
  Bell, Bot, List, ArrowRight, AlertTriangle, Clock, 
  Stethoscope, CloudOff, Info
} from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'Sistem Yöneticisi') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Dashboard özet
        try {
          const res = await api.get(`/dashboard/summary?userId=${user.userId}`);
          setSummary(res.data);
        } catch (err) {
          console.error('Summary fetch error:', err);
          setSummary({
            toplamHayvan: 0,
            gebeSayisi: 0,
            bosSayisi: 0,
            saglikliSayisi: 0,
            hastaSayisi: 0,
            sagmalSayisi: 0,
            kurudaSayisi: 0,
            inekSayisi: 0,
            duveSayisi: 0,
            tosunSayisi: 0,
            danaSayisi: 0,
            buzagiSayisi: 0
          });
        }

        // Hatırlatıcılar
        try {
          const res = await api.get(`/Reminders?userId=${user.userId}`);
          setReminders(Array.isArray(res.data) ? res.data.slice(0, 4) : []);
        } catch (err) {
          console.error('Reminders fetch error in Dashboard:', err);
          setReminders([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const priorityConfig = {
    'Yüksek': { color: 'text-red-600 bg-red-50 border-red-100', icon: AlertTriangle },
    'Orta':   { color: 'text-orange-600 bg-orange-50 border-orange-100', icon: Clock },
    'Düşük':  { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Bell },
  };

  const quickActions = [
    { label: 'Hayvanlar', desc: 'Sürü listesini görüntüle', icon: List, path: '/animals', color: 'from-blue-500 to-blue-600' },
    { label: 'Hatırlatıcılar', desc: 'Görev ve aşı takvimi', icon: Bell, path: '/reminders', color: 'from-orange-400 to-orange-500' },
    { label: 'AI Danışman', desc: 'Yapay zeka ile analiz', icon: Bot, path: '/ai-chat', color: 'from-purple-500 to-purple-600' },
  ];

  const total = summary?.toplamHayvan || 1;
  const animalTypes = [
    { label: 'İnek', value: summary?.inekSayisi || 0, color: 'bg-blue-500' },
    { label: 'Düve', value: summary?.duveSayisi || 0, color: 'bg-emerald-500' },
    { label: 'Tosun', value: summary?.tosunSayisi || 0, color: 'bg-amber-500' },
    { label: 'Dana', value: summary?.danaSayisi || 0, color: 'bg-indigo-500' },
    { label: 'Buzağı', value: summary?.buzagiSayisi || 0, color: 'bg-rose-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
      {/* Başlık */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sürü Özeti</h1>
          <p className="text-gray-500 mt-1">Sürünüzün genel durumu ve anlık veriler.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
           <Info className="w-4 h-4 text-primary-500" />
           <span className="text-sm font-semibold text-gray-700">Veriler anlık güncellenmektedir.</span>
        </div>
      </div>

      {/* Ana İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <Card title="Toplam Hayvan" value={summary?.toplamHayvan} icon={Activity} onClick={() => navigate('/animals')} />
        <Card title="Gebe" value={summary?.gebeSayisi} icon={PlusCircle} className="border-l-4 border-l-green-400" onClick={() => navigate('/animals?status=Gebe')} />
        <Card title="Boş" value={summary?.bosSayisi} icon={AlertCircle} className="border-l-4 border-l-gray-400" onClick={() => navigate('/animals?status=Boş')} />
        <Card title="Sağlıklı" value={summary?.saglikliSayisi} icon={CheckCircle} className="border-l-4 border-l-blue-400" onClick={() => navigate('/animals?health=Sağlıklı')} />
        <Card title="Hasta" value={summary?.hastaSayisi} icon={Stethoscope} className="border-l-4 border-l-red-500" onClick={() => navigate('/animals?health=Hasta')} />
        <Card title="Sağmal" value={summary?.sagmalSayisi} icon={Droplets} className="border-l-4 border-l-purple-400" onClick={() => navigate('/animals')} />
        <Card title="Kuruda" value={summary?.kurudaSayisi} icon={CloudOff} className="border-l-4 border-l-orange-400" onClick={() => navigate('/animals?status=Kuruda')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Hayvan Türleri Detaylı Dağılım */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
               <List className="w-5 h-5 text-primary-500" />
               Hayvan Türleri Dağılımı
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {animalTypes.map((type) => (
                <div key={type.label} onClick={() => navigate(`/animals?type=${type.label}`)} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer hover:border-primary-200 hover:shadow-md">
                  <div className={`w-3 h-3 rounded-full ${type.color} mb-3 shadow-sm`} />
                  <span className="text-sm font-bold text-gray-500 mb-1">{type.label}</span>
                  <span className="text-2xl font-black text-gray-900">{type.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Yaklaşan Hatırlatıcılar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <h2 className="text-base font-bold text-gray-800">Yaklaşan Hatırlatıcılar</h2>
              </div>
              <button onClick={() => navigate('/reminders')} className="text-sm text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1">
                Tümünü Gör <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {reminders.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6 font-medium">Yaklaşan hatırlatıcı yok.</p>
              ) : (
                reminders.map((r) => {
                  const cfg = priorityConfig[r.priority] || priorityConfig['Düşük'];
                  const Icon = cfg.icon;
                  return (
                    <div key={r.id || r.reminderId} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-200 transition-all">
                      <div className={`p-2 rounded-lg border ${cfg.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">{r.title || r.reminderTitle}</p>
                        <p className="text-xs text-gray-500">{r.animalName} · {new Date(r.dueDate || r.reminderDate).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${cfg.color}`}>
                        {r.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sağ: Hızlı Erişim ve Genel Durum */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">Hızlı İşlemler</h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-primary-200 transition-all text-left group"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white shadow-md`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-primary-600 transition-colors">{action.label}</p>
                      <p className="text-xs text-gray-400">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 ml-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-6">Genel Sağlık & Verim</h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>SAĞLIK DURUMU (Sağlıklı)</span>
                  <span className="text-primary-600">%{Math.round((summary?.saglikliSayisi / total) * 100) || 0}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${(summary?.saglikliSayisi / total) * 100}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>ÜRETİM DURUMU (Sağmal)</span>
                  <span className="text-purple-600">%{Math.round((summary?.sagmalSayisi / total) * 100) || 0}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 transition-all" style={{ width: `${(summary?.sagmalSayisi / total) * 100}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>HASTALIK ORANI</span>
                  <span className="text-red-600">%{Math.round((summary?.hastaSayisi / total) * 100) || 0}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all" style={{ width: `${(summary?.hastaSayisi / total) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
