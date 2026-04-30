import React from 'react';
import { Clock, Users, Server, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminActivities = () => {
  const navigate = useNavigate();

  // Mock Detaylı Aktiviteler
  const allActivities = [
    { id: 1, text: 'Ahmet Yılmaz (ahmet@test.com) sisteme yeni kayıt oldu.', time: '2 saat önce', type: 'user', ip: '192.168.1.1' },
    { id: 2, text: 'Sistem otomatik veritabanı yedeği başarıyla alındı.', time: '5 saat önce', type: 'system', size: '45MB' },
    { id: 3, text: 'Mehmet Kaya şifresini başarıyla sıfırladı.', time: 'Dün, 14:30', type: 'security', method: 'Email Link' },
    { id: 4, text: 'Yeni sürüm (v1.2) güncellemeleri sunucuya yüklendi.', time: '2 gün önce', type: 'system', version: 'v1.2.0' },
    { id: 5, text: 'Hatırlatıcı servisi "Hayvan-004" için aşı uyarısı gönderdi.', time: '3 gün önce', type: 'system' },
    { id: 6, text: 'Bilinmeyen bir cihazdan 3 kez hatalı giriş denemesi yapıldı.', time: '4 gün önce', type: 'security', ip: '45.22.11.3' },
    { id: 7, text: 'Zeynep Çiftlik (zeynep@test.com) profilini güncelledi.', time: '5 gün önce', type: 'user' },
    { id: 8, text: 'Haftalık bakım komutu başarıyla çalıştırıldı.', time: '1 hafta önce', type: 'system', duration: '45sn' },
    { id: 9, text: 'Sistem yöneticisi (Siz) giriş yaptı.', time: '1 hafta önce', type: 'user', ip: '192.168.1.5' },
    { id: 10, text: 'Sunucu CPU kullanımı %90 eşiğini aştı (Geçici Darboğaz).', time: '1 hafta önce', type: 'system', peak: '94%' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Üst Kısım */}
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sistem Logları & Aktiviteler</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem üzerinde gerçekleşen tüm eylemlerin detaylı kronolojik listesi.</p>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent">
          {allActivities.map((act) => (
            <div key={act.id} className="relative flex items-start gap-6 group py-4">
              
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-white shadow-sm shrink-0 relative z-10 mt-1">
                {act.type === 'user' && <Users className="w-4 h-4 text-blue-500" />}
                {act.type === 'system' && <Server className="w-4 h-4 text-purple-500" />}
                {act.type === 'security' && <ShieldAlert className="w-4 h-4 text-emerald-500" />}
              </div>
              
              <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-primary-200 transition-colors group-hover:bg-white group-hover:shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <p className="text-sm text-gray-900 font-medium">{act.text}</p>
                  <span className="text-xs font-semibold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 whitespace-nowrap">
                    {act.time}
                  </span>
                </div>
                
                {/* Meta Data Row */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                  {act.ip && <span className="bg-gray-200/50 px-2 py-0.5 rounded text-gray-600 font-mono">IP: {act.ip}</span>}
                  {act.size && <span className="bg-purple-100 px-2 py-0.5 rounded text-purple-700">Boyut: {act.size}</span>}
                  {act.method && <span className="bg-blue-100 px-2 py-0.5 rounded text-blue-700">Yöntem: {act.method}</span>}
                  {act.version && <span className="bg-gray-800 text-gray-100 px-2 py-0.5 rounded">{act.version}</span>}
                  {act.peak && <span className="bg-red-100 px-2 py-0.5 rounded text-red-700">Zirve: {act.peak}</span>}
                  {act.duration && <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-700">Süre: {act.duration}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Yükle Butonu (Mock) */}
        <div className="mt-8 text-center">
          <button className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors">
            Daha Eski Kayıtları Yükle
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminActivities;
