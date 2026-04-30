import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity, PlusCircle, CheckCircle, AlertCircle, Droplets,
  Bell, Bot, List, Calendar, ArrowRight, AlertTriangle, Clock
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
            sagmalSayisi: 0
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

  // Sağlık dağılımı pasta-benzeri görünüm
  const total = summary?.toplamHayvan || 1;
  const healthData = [
    { label: 'Sağlıklı', value: summary?.saglikliSayisi, color: 'bg-green-400', pct: Math.round((summary?.saglikliSayisi / total) * 100) },
    { label: 'Gebe', value: summary?.gebeSayisi, color: 'bg-blue-400', pct: Math.round((summary?.gebeSayisi / total) * 100) },
    { label: 'Sağmal', value: summary?.sagmalSayisi, color: 'bg-purple-400', pct: Math.round((summary?.sagmalSayisi / total) * 100) },
    { label: 'Boş', value: summary?.bosSayisi, color: 'bg-orange-300', pct: Math.round((summary?.bosSayisi / total) * 100) },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sürü Özeti</h1>
        <p className="text-gray-500 mt-1">Sürünüzün genel durumu ve yaklaşan görevler.</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        <Card title="Toplam Hayvan" value={summary?.toplamHayvan} icon={Activity} />
        <Card title="Gebe" value={summary?.gebeSayisi} icon={PlusCircle} className="border-l-4 border-l-green-400" />
        <Card title="Boş" value={summary?.bosSayisi} icon={AlertCircle} className="border-l-4 border-l-orange-400" />
        <Card title="Sağlıklı" value={summary?.saglikliSayisi} icon={CheckCircle} className="border-l-4 border-l-blue-400" />
        <Card title="Sağmal" value={summary?.sagmalSayisi} icon={Droplets} className="border-l-4 border-l-purple-400" />
      </div>

      {/* Ana İçerik: 2 Sütun */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sol: Yaklaşan Hatırlatıcılar */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-semibold text-gray-800">Yaklaşan Hatırlatıcılar</h2>
            </div>
            <button
              onClick={() => navigate('/reminders')}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Tümü <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {reminders.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Yaklaşan hatırlatıcı yok.</p>
            ) : (
              reminders.map((r) => {
                const cfg = priorityConfig[r.priority] || priorityConfig['Düşük'];
                const Icon = cfg.icon;
                const title = r.title || r.reminderTitle || 'İsimsiz Görev';
                const date = r.dueDate || r.reminderDate || r.date;
                return (
                  <div key={r.id || r.reminderId} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-200 transition-colors">
                    <div className={`p-2 rounded-lg border ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                      <p className="text-xs text-gray-500">
                        {r.animalName} {date ? ` · ${new Date(date).toLocaleDateString('tr-TR')}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      {r.priority}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sağ Sütun */}
        <div className="space-y-6">

          {/* Hızlı Erişim */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Hızlı Erişim</h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-primary-200 transition-all text-left group"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">{action.label}</p>
                      <p className="text-xs text-gray-400">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-400 ml-auto transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sürü Dağılımı */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Sürü Dağılımı</h2>
            {/* Bar chart */}
            <div className="flex h-4 rounded-full overflow-hidden mb-4 gap-0.5">
              {healthData.map((d) => (
                <div
                  key={d.label}
                  className={`${d.color} transition-all`}
                  style={{ width: `${d.pct}%` }}
                  title={`${d.label}: %${d.pct}`}
                />
              ))}
            </div>
            <div className="space-y-2">
              {healthData.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                    <span className="text-gray-600">{d.label}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{d.value} <span className="text-xs text-gray-400 font-normal">(%{d.pct})</span></span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
