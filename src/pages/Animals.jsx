import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { Search, Plus, Edit2, Trash2, Filter, X, Camera, ChevronDown, Save } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['Tümü', 'Gebe', 'Boş', 'Sağmal'];
const HEALTH_OPTIONS = ['Tümü', 'Sağlıklı', 'Hasta', 'Tedavide'];
const GENDER_OPTIONS = ['Dişi', 'Erkek'];

const DEFAULT_FORM = {
  tagNumber: '', name: '', breed: '', gender: 'Dişi',
  status: 'Boş', health: 'Sağlıklı', birthDate: '', notes: ''
};

const Animals = () => {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filterStatus, setFilterStatus] = useState('Tümü');
  const [filterHealth, setFilterHealth] = useState('Tümü');
  const [showFilter, setShowFilter] = useState(false);

  // Modal state: 'add' | 'edit' | 'photo' | null
  const [modalMode, setModalMode] = useState(null);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formImage, setFormImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [photoAnimal, setPhotoAnimal] = useState(null); // fotoğraf seçilen hayvan
  const fileRef = useRef(null);
  const editFileRef = useRef(null);

  const fetchAnimals = async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/animals?userId=${user.userId}`);
      // Backend alan adlarını frontend'e map et
      const mapped = res.data.map(a => ({
        id: a.animalId ?? a.id,
        tagNumber: a.tagNumber,
        name: a.name,
        gender: a.gender,
        breed: a.breed,
        birthDate: a.birthDate,
        status: a.pregnancyStatus ?? a.status ?? 'Boş',
        health: a.healthStatus ?? a.health ?? 'Sağlıklı',
        milkStatus: a.milkStatus,
        animalGroup: a.animalGroup,
        notes: a.notes,
      }));
      setAnimals(mapped);
    } catch (err) {
      console.error('Fetch error:', err);
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnimals(); }, [user]);

  const closeModal = () => {
    setModalMode(null);
    setEditingAnimal(null);
    setForm(DEFAULT_FORM);
    setFormImage(null);
    setImagePreview(null);
    setPhotoAnimal(null);
  };

  // Görsel seç (ekleme/düzenleme)
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImage(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Satırdaki fotoğrafa tıklayarak değiştirme
  const handlePhotoClick = (animal) => {
    setPhotoAnimal(animal);
    editFileRef.current?.click();
  };

  const handleDirectPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file || !photoAnimal) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      localStorage.setItem(`animal_img_${photoAnimal.id}`, reader.result);
      setAnimals(prev => [...prev]); // re-render
      setPhotoAnimal(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Yeni hayvan kaydet
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.tagNumber || !form.name || !user?.userId) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        userId: user.userId,
        tagNumber: form.tagNumber,
        name: form.name,
        breed: form.breed,
        gender: form.gender,
        pregnancyStatus: form.status,
        healthStatus: form.health,
        milkStatus: form.status === 'Sağmal' ? 'Sağmal' : form.status,
        animalGroup: form.status === 'Sağmal' ? 'Sağmal İnekler' : form.status === 'Gebe' ? 'Gebe İnekler' : 'Boş İnekler',
        isActive: true,
        birthDate: form.birthDate || null,
        notes: form.notes || '',
      };
      const res = await api.post('/animals', payload);
      const newId = res.data?.animalId ?? res.data?.id ?? res.data?.Id ?? Date.now();
      if (formImage) localStorage.setItem(`animal_img_${newId}`, formImage);
      await fetchAnimals();
      closeModal();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data || err?.message || 'Bilinmeyen hata';
      setSaveError(`Kayıt başarısız: ${JSON.stringify(msg)}`);
      console.error('POST /animals hatası:', err?.response || err);
    } finally {
      setSaving(false);
    }
  };

  // Düzenleme modunu aç
  const openEdit = (animal) => {
    setEditingAnimal(animal);
    setForm({
      tagNumber: animal.tagNumber || '',
      name: animal.name || '',
      breed: animal.breed || '',
      gender: animal.gender || 'Dişi',
      status: animal.status || 'Boş',
      health: animal.health || 'Sağlıklı',
      birthDate: animal.birthDate ? animal.birthDate.split('T')[0] : '',
      notes: animal.notes || '',
    });
    const animalId = animal.id;
    const img = animalId ? localStorage.getItem(`animal_img_${animalId}`) : null;
    if (img) { setFormImage(img); setImagePreview(img); }
    setModalMode('edit');
  };

  // Güncelle
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.tagNumber || !form.name || !user?.userId) return;
    setSaving(true);
    try {
      const payload = {
        userId: user.userId,
        tagNumber: form.tagNumber, name: form.name, breed: form.breed,
        gender: form.gender,
        pregnancyStatus: form.status,
        healthStatus: form.health,
        birthDate: form.birthDate || null, notes: form.notes,
      };
      await api.put(`/animals/${editingAnimal.id}`, payload);
      if (formImage) {
        localStorage.setItem(`animal_img_${editingAnimal.id}`, formImage);
      } else {
        // Kullanıcı görseli kaldırdıysa sil
        localStorage.removeItem(`animal_img_${editingAnimal.id}`);
      }
      await fetchAnimals();
      closeModal();
    } catch {
      if (formImage) {
        localStorage.setItem(`animal_img_${editingAnimal.id}`, formImage);
      } else {
        localStorage.removeItem(`animal_img_${editingAnimal.id}`);
      }
      setAnimals(prev => prev.map(a => a.id === editingAnimal.id ? { ...a, ...form } : a));
      closeModal();
    } finally {
      setSaving(false);
    }
  };


  // Sil
  const handleDelete = async (animal) => {
    if (!window.confirm(`"${animal.name}" hayvanını silmek istediğinize emin misiniz?`)) return;
    try {
      await api.delete(`/animals/${animal.id}`);
      await fetchAnimals();
    } catch {
      setAnimals(prev => prev.filter(a => a.id !== animal.id));
    }
    localStorage.removeItem(`animal_img_${animal.id}`);
  };

  // Filtrele
  const filtered = animals.filter(a => {
    const matchSearch =
      (a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (a.tagNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'Tümü' || a.status === filterStatus || a.milkStatus === filterStatus;
    const matchHealth = filterHealth === 'Tümü' || a.health === filterHealth;
    return matchSearch && matchStatus && matchHealth;
  });

  const statusColor = (s) => {
    if (s === 'Gebe') return 'bg-green-100 text-green-700';
    if (s === 'Sağmal') return 'bg-purple-100 text-purple-700';
    return 'bg-orange-100 text-orange-700';
  };
  const healthColor = (h) => {
    if (h === 'Sağlıklı') return 'bg-blue-100 text-blue-700';
    if (h === 'Hasta') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  // Form Modal (add veya edit)
  const isEdit = modalMode === 'edit';
  const showFormModal = modalMode === 'add' || modalMode === 'edit';




  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Gizli dosya input - satır fotoğrafı değiştirme */}
      <input ref={editFileRef} type="file" accept="image/*" onChange={handleDirectPhotoChange} className="hidden" />

      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hayvanlar</h1>
          <p className="text-gray-500 mt-1">Sürünüzdeki hayvanların detaylı listesi.</p>
        </div>
        <button
          onClick={() => { setForm(DEFAULT_FORM); setFormImage(null); setImagePreview(null); setModalMode('add'); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" /> Yeni Hayvan Ekle
        </button>
      </div>

      {/* Kart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Arama + Filtre */}
        <div className="p-5 border-b border-gray-100 flex flex-col gap-3 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Küpe No veya İsim ara..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${showFilter ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" /> Filtrele
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilter && (
            <div className="flex flex-wrap gap-4 pt-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Gebelik Durumu</p>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Sağlık Durumu</p>
                <div className="flex gap-2">
                  {HEALTH_OPTIONS.map(h => (
                    <button key={h} onClick={() => setFilterHealth(h)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${filterHealth === h ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}
                    >{h}</button>
                  ))}
                </div>
              </div>
              {(filterStatus !== 'Tümü' || filterHealth !== 'Tümü') && (
                <button onClick={() => { setFilterStatus('Tümü'); setFilterHealth('Tümü'); }}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 self-end">
                  <X className="w-3 h-3" /> Temizle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Kart Listesi */}
        <div className="p-5">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Veriler yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Kayıt bulunamadı.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((animal) => {
                const img = localStorage.getItem(`animal_img_${animal.id}`);
                return (
                  <div key={animal.id} className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-primary-200 transition-all group">
                    {/* Fotoğraf alanı */}
                    <div
                      className="relative w-full h-44 bg-gradient-to-br from-primary-50 to-blue-50 cursor-pointer overflow-hidden"
                      onClick={() => handlePhotoClick(animal)}
                      title="Fotoğraf değiştirmek için tıklayın"
                    >
                      {img ? (
                        <img src={img} alt={animal.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-primary-300">
                          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl mb-2">
                            {(animal.name || '?')[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-primary-400">Fotoğraf eklemek için tıklayın</span>
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <Camera className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    </div>

                    {/* İçerik */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{animal.name}</h3>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{animal.tagNumber}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(animal)}
                            className="p-1.5 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(animal)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {animal.status && <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${statusColor(animal.status)}`}>{animal.status}</span>}
                        {animal.health && <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${healthColor(animal.health)}`}>{animal.health}</span>}
                        {animal.milkStatus && <span className="px-2.5 py-0.5 text-xs rounded-full font-medium bg-purple-100 text-purple-700">{animal.milkStatus}</span>}
                        {animal.gender && <span className="px-2.5 py-0.5 text-xs rounded-full font-medium bg-gray-100 text-gray-600">{animal.gender}</span>}
                      </div>

                      <div className="text-xs text-gray-500 space-y-0.5">
                        {animal.breed && <div>🐄 {animal.breed}</div>}
                        {animal.birthDate && <div>📅 {new Date(animal.birthDate).toLocaleDateString('tr-TR')}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400">
            {filtered.length} hayvan {animals.length !== filtered.length ? `(toplam ${animals.length})` : ''}
          </div>
        )}
      </div>

      {/* Yeni Hayvan / Düzenle Modali */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Hayvanı Düzenle' : 'Yeni Hayvan Ekle'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isEdit ? handleUpdate : handleSave} className="p-6 space-y-5">
              {/* Görsel */}
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-400 cursor-pointer flex items-center justify-center bg-gray-50 hover:bg-primary-50 transition-colors overflow-hidden"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Önizleme" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 gap-1">
                      <Camera className="w-7 h-7" />
                      <span className="text-xs">Fotoğraf Ekle</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                {imagePreview && (
                  <button type="button" onClick={() => { setFormImage(null); setImagePreview(null); }}
                    className="text-xs text-red-500 hover:underline">Görseli kaldır</button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Küpe Numarası *</label>
                  <input required value={form.tagNumber} onChange={e => setForm(p => ({ ...p, tagNumber: e.target.value }))}
                    placeholder="TR12345678"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İsim *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Sarıkız"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Irk</label>
                  <input value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))}
                    placeholder="Holstein"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
                  <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                    {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gebelik Durumu</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                    {['Boş', 'Gebe', 'Sağmal'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sağlık Durumu</label>
                  <select value={form.health} onChange={e => setForm(p => ({ ...p, health: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20">
                    {['Sağlıklı', 'Hasta', 'Tedavide'].map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Tarihi</label>
                  <input type="date" value={form.birthDate} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Hayvanla ilgili notlar..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>

              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  ⚠️ {saveError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Animals;
