import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Bell, CheckCircle2, Circle, Clock, Building, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEFAULT_FORM = {
  reminderTitle: '',
  description: '',
  animalId: '',
  animalName: '',
  reminderDate: '',
  priority: 'Orta',
  status: 'Beklemede'
};

const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetchReminders = async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get(`/Reminders?userId=${user.userId}`);
      const mappedData = response.data.map(r => ({
        id: r.reminderId,
        userId: r.userId,
        title: r.reminderTitle || '',
        description: r.description || '',
        animalName: r.animalName || '',
        animalId: r.animalId || null,
        date: r.reminderDate ? r.reminderDate.split('T')[0] : '',
        priority: r.priority || 'Orta',
        status: r.isCompleted ? 'Tamamlandı' : (r.status || 'Beklemede'),
        isCompleted: r.isCompleted || false
      }));
      setReminders(mappedData);
    } catch (err) {
      console.error('Reminders fetch error:', err);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.userId) return;
    fetchReminders();
    const fetchAnimals = async () => {
      try {
        const res = await api.get(`/animals?userId=${user.userId}`);
        setAnimals(res.data);
      } catch (err) {
        console.error('Animals fetch error in Reminders:', err);
      }
    };
    fetchAnimals();
  }, [user]);

  const closeModal = () => {
    setShowModal(false);
    setModalMode(null);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setModalMode('add');
    setShowModal(true);
  };

  const openEdit = (reminder) => {
    setForm({
      reminderTitle: reminder.title || '',
      description: reminder.description || '',
      animalId: reminder.animalId || '',
      animalName: reminder.animalName || '',
      reminderDate: reminder.date || '',
      priority: reminder.priority || 'Orta',
      status: reminder.status || 'Beklemede'
    });
    setEditingId(reminder.id);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.reminderTitle || !user?.userId) return;
    setSaving(true);

    const payload = {
      userId: user.userId,
      animalId: form.animalId ? parseInt(form.animalId) : 1,
      animalName: form.animalName || 'Belirsiz',
      eventId: 1, 
      reminderTitle: form.reminderTitle,
      description: form.description,
      reminderDate: form.reminderDate ? `${form.reminderDate}T00:00:00` : new Date().toISOString(),
      priority: form.priority,
      status: form.status,
      isCompleted: form.status === 'Tamamlandı'
    };

    try {
      if (modalMode === 'add') {
        const res = await api.post('/Reminders', payload);
        const newId = res.data?.reminderId ?? Date.now();
        const newObj = { id: newId, title: form.reminderTitle, date: form.reminderDate, ...payload };
        setReminders(prev => [...prev, newObj]);
      } else {
        await api.put(`/Reminders/${editingId}`, payload);
        setReminders(prev => prev.map(r => r.id === editingId ? { ...r, title: form.reminderTitle, date: form.reminderDate, ...payload } : r));
      }
      closeModal();
    } catch (err) {
      console.error("Backend'e kayıt hatası:", err.response?.data || err.message);
      alert("Hata: Backend'e kayıt yapılamadı. Gerekli alanları doldurduğunuzdan emin olun.");
      // Backend yoksa frontend'de güncelle
      let updated;
      if (modalMode === 'add') {
        updated = [...reminders, { id: Date.now(), title: form.reminderTitle, date: form.reminderDate, ...payload }];
      } else {
        updated = reminders.map(r => r.id === editingId ? { ...r, title: form.reminderTitle, date: form.reminderDate, ...payload } : r);
      }
      setReminders(updated);
      localStorage.setItem('mock_reminders', JSON.stringify(updated));
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu hatırlatıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/Reminders/${id}`);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch {
      const updated = reminders.filter(r => r.id !== id);
      setReminders(updated);
      localStorage.setItem('mock_reminders', JSON.stringify(updated));
    }
  };

  const toggleComplete = (id) => {
    const updated = reminders.map(r =>
      r.id === id ? { ...r, status: r.status === 'Tamamlandı' ? 'Beklemede' : 'Tamamlandı' } : r
    );
    setReminders(updated);
    localStorage.setItem('mock_reminders', JSON.stringify(updated));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hatırlatıcılar</h1>
          <p className="text-gray-500 mt-1">Yaklaşan aşılar, kontroller ve bildirimler.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Yeni Hatırlatıcı
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Yükleniyor...</div>
          ) : reminders.length === 0 ? (
            <div className="p-10 text-center text-gray-500 flex flex-col items-center">
              <Bell className="w-12 h-12 text-gray-300 mb-3" />
              Herhangi bir aktif hatırlatıcı bulunmuyor.
            </div>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder.id} className="p-5 flex flex-col sm:flex-row items-start gap-4 hover:bg-primary-50/30 transition-colors group">

                {/* Durum Değiştirme (Tick) Butonu ve Açıklaması */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleComplete(reminder.id)}
                    className="group-hover:text-primary-500 focus:outline-none transition-colors shrink-0"
                    title={reminder.status === 'Tamamlandı' ? 'Beklemeye Al' : 'Tamamlandı Olarak İşaretle'}
                  >
                    {reminder.status === 'Tamamlandı' ? (
                      <CheckCircle2 className="w-7 h-7 text-green-500" />
                    ) : (
                      <Circle className="w-7 h-7 text-gray-300 hover:text-primary-400" />
                    )}
                  </button>
                  {/* MOBİL İÇİN VEYA DAHA AÇIK OLMASI İÇİN TİCK YANINDA YAZI */}
                  <span className={`text-xs font-medium sm:hidden ${reminder.status === 'Tamamlandı' ? 'text-green-600' : 'text-gray-400'}`}>
                    {reminder.status === 'Tamamlandı' ? 'Tamamlandı' : 'Tamamla'}
                  </span>
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-base font-semibold transition-colors ${reminder.status === 'Tamamlandı' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {reminder.title}
                    </h3>

                    {/* Düzenle / Sil Butonları */}
                    <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(reminder)}
                        className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(reminder.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {reminder.description && (
                    <p className={`mt-1 text-sm ${reminder.status === 'Tamamlandı' ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                      {reminder.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-sm text-gray-500">
                    {reminder.animalName && (
                      <span className="font-medium text-primary-600 flex items-center gap-1 bg-primary-50 px-2.5 py-1 rounded-lg">
                        <Building className="w-4 h-4" /> {reminder.animalName}
                      </span>
                    )}
                    {reminder.date && (
                      <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                        <Clock className="w-4 h-4 text-gray-400" /> {reminder.date}
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold
                      ${reminder.priority === 'Yüksek' ? 'bg-red-50 text-red-600 border border-red-100' :
                        reminder.priority === 'Orta' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                          'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                      {reminder.priority} Öncelik
                    </span>

                    {/* PC İÇİN AÇIKLAMA LABEL */}
                    <span className={`hidden sm:inline-block text-xs font-medium px-2 py-1 rounded-md ml-auto
                      ${reminder.status === 'Tamamlandı' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {reminder.status === 'Tamamlandı' ? '✔ Görev Tamamlandı' : 'Zamanı Bekleniyor'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'add' ? 'Yeni Hatırlatıcı Ekle' : 'Hatırlatıcıyı Düzenle'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input required value={form.reminderTitle} onChange={e => setForm(p => ({ ...p, reminderTitle: e.target.value }))}
                  placeholder="Örn: Şap Aşısı"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detaylı Açıklama</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Hatırlatıcının detayı, ne yapılacağı..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Hayvan/Sürü</label>
                  <select value={form.animalName} onChange={e => {
                    const selectedAnimal = animals.find(a => a.name === e.target.value);
                    setForm(p => ({ ...p, animalName: e.target.value, animalId: selectedAnimal ? selectedAnimal.animalId : null }));
                  }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                    <option value="">Seçiniz...</option>
                    <option value="Tüm Sürü">Tüm Sürü</option>
                    {animals.map(a => (
                      <option key={a.id || a.animalId} value={a.name}>{a.name} ({a.tagNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input type="date" value={form.reminderDate} onChange={e => setForm(p => ({ ...p, reminderDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                    {['Düşük', 'Orta', 'Yüksek'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                    <option>Beklemede</option>
                    <option>Planlandı</option>
                    <option>Tamamlandı</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Kaydediliyor...' : (modalMode === 'add' ? 'Ekle' : 'Güncelle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
