import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import { Search, Plus, Edit2, Trash2, Filter, X, Camera, ChevronDown, Save, Info, Baby, Heart } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['Tümü', 'Gebe', 'Boş', 'Kuruda'];
const HEALTH_OPTIONS = ['Tümü', 'Sağlıklı', 'Hasta', 'Tedavide'];
const GENDER_OPTIONS = ['Dişi', 'Erkek'];
const TYPE_OPTIONS = ['İnek', 'Düve', 'Tosun', 'Dana', 'Buzağı'];

const DEFAULT_FORM = {
  tagNumber: '', name: '', breed: '', gender: 'Dişi',
  status: 'Boş', health: 'Sağlıklı', birthDate: '', notes: '',
  age: '', type: 'İnek', motherTag: '', fatherTag: ''
};

const Animals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  // Detay sayfasından gelen yönlendirmeyi yakala
  const locationState = window.history.state?.usr;

  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'Tümü');
  const [filterHealth, setFilterHealth] = useState(searchParams.get('health') || 'Tümü');
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'Tümü');
  const [showFilter, setShowFilter] = useState(false);

  // Modal state: 'add' | 'edit' | 'photo' | null
  const [modalMode, setModalMode] = useState(null);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formImageFile, setFormImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [photoAnimal, setPhotoAnimal] = useState(null); // fotoğraf seçilen hayvan
  const fileRef = useRef(null);
  const editFileRef = useRef(null);

  const getImageUrl = (id) => {
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}/images/animals/${id}.jpg?t=${new Date().getTime()}`;
  };

  const uploadImageToAPI = async (id, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/Animals/${id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (e) {
      console.error('Resim yükleme hatası:', e);
    }
  };

  const fetchAnimals = async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/animals?userId=${user.userId}`);
      const mapped = res.data.map(a => ({
        id: a.animalId ?? a.id,
        tagNumber: a.tagNumber,
        name: a.name,
        gender: a.gender,
        breed: a.breed,
        birthDate: a.birthDate,
        age: a.age,
        type: a.type,
        motherTag: a.motherTag,
        fatherTag: a.fatherTag,
        status: a.pregnancyStatus ?? a.status ?? 'Boş',
        health: a.healthStatus ?? a.health ?? 'Sağlıklı',
        milkStatus: a.milkStatus,
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

  useEffect(() => {
    if (locationState?.showAdd) {
      setModalMode('add');
      setForm(prev => ({
        ...DEFAULT_FORM,
        motherTag: locationState.prefillMother || '',
        type: 'Buzağı'
      }));
      // State'i temizle ki sayfa yenilenince tekrar açılmasın
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  const closeModal = () => {
    setModalMode(null);
    setEditingAnimal(null);
    setForm(DEFAULT_FORM);
    setFormImageFile(null);
    setImagePreview(null);
    setPhotoAnimal(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoClick = (animal, e) => {
    e.stopPropagation();
    setPhotoAnimal(animal);
    editFileRef.current?.click();
  };

  const handleDirectPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !photoAnimal) return;
    
    // Geçici gösterim için
    const reader = new FileReader();
    reader.onloadend = async () => {
       await uploadImageToAPI(photoAnimal.id, file);
       setAnimals(prev => [...prev]); // Yeniden render
       setPhotoAnimal(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
        age: form.age ? parseInt(form.age) : null,
        type: form.type,
        motherTag: form.motherTag,
        fatherTag: form.fatherTag,
        pregnancyStatus: form.status,
        healthStatus: form.health,
        milkStatus: form.status === 'Kuruda' ? 'Kuruda' : (form.status === 'Gebe' ? 'Gebe' : 'Sağmal'),
        isActive: true,
        birthDate: form.birthDate || null,
        notes: form.notes || '',
      };
      const res = await api.post('/animals', payload);
      const newId = res.data?.animalId ?? res.data?.id;
      if (formImageFile) {
         await uploadImageToAPI(newId, formImageFile);
      }
      await fetchAnimals();
      closeModal();
    } catch (err) {
      setSaveError('Kayıt sırasında bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (animal, e) => {
    e.stopPropagation();
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
      age: animal.age?.toString() || '',
      type: animal.type || 'İnek',
      motherTag: animal.motherTag || '',
      fatherTag: animal.fatherTag || ''
    });
    setFormImageFile(null);
    setImagePreview(getImageUrl(animal.id));
    setModalMode('edit');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        userId: user.userId,
        tagNumber: form.tagNumber, name: form.name, breed: form.breed,
        gender: form.gender,
        age: form.age ? parseInt(form.age) : null,
        type: form.type,
        motherTag: form.motherTag,
        fatherTag: form.fatherTag,
        pregnancyStatus: form.status,
        healthStatus: form.health,
        birthDate: form.birthDate || null, notes: form.notes,
        isActive: true
      };
      await api.put(`/animals/${editingAnimal.id}`, payload);
      if (formImageFile) {
         await uploadImageToAPI(editingAnimal.id, formImageFile);
      }
      await fetchAnimals();
      closeModal();
    } catch {
      setSaveError('Güncelleme sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (animal, e) => {
    e.stopPropagation();
    if (!window.confirm(`"${animal.name}" silinsin mi?`)) return;
    try {
      await api.delete(`/animals/${animal.id}`);
      await fetchAnimals();
    } catch {
      alert('Hata oluştu.');
    }
  };

  const filtered = animals.filter(a => {
    const matchSearch =
      (a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (a.tagNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'Tümü' || a.status === filterStatus;
    const matchHealth = filterHealth === 'Tümü' || a.health === filterHealth;
    const matchType = filterType === 'Tümü' || a.type === filterType;
    return matchSearch && matchStatus && matchHealth && matchType;
  });

  const statusColor = (s) => {
    if (s === 'Gebe') return 'bg-green-100 text-green-700';
    if (s === 'Kuruda') return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  };
  const healthColor = (h) => {
    if (h === 'Sağlıklı') return 'bg-emerald-100 text-emerald-700';
    if (h === 'Hasta') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const isEdit = modalMode === 'edit';
  const showFormModal = modalMode === 'add' || modalMode === 'edit';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      <input ref={editFileRef} type="file" accept="image/*" onChange={handleDirectPhotoChange} className="hidden" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sürüm</h1>
          <p className="text-gray-500 mt-1 font-medium">Hayvanlarınızın detaylı yönetim paneli.</p>
        </div>
        <button
          onClick={() => { setForm(DEFAULT_FORM); setFormImageFile(null); setImagePreview(null); setModalMode('add'); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Yeni Hayvan Kaydı
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col gap-4 bg-gray-50/30">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="İsim veya Küpe No ile ara..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
              />
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-5 py-3 border rounded-2xl text-sm font-bold transition-all ${showFilter ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" /> Filtreler
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilter && (
            <div className="flex flex-wrap gap-6 pt-2 animate-slide-down">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Gebelik Durumu</p>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterStatus === s ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/30' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Sağlık Durumu</p>
                <div className="flex gap-2">
                  {HEALTH_OPTIONS.map(h => (
                    <button key={h} onClick={() => setFilterHealth(h)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterHealth === h ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/30' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}
                    >{h}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tür</p>
                <div className="flex gap-2">
                  {['Tümü', ...TYPE_OPTIONS].map(t => (
                    <button key={t} onClick={() => setFilterType(t)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterType === t ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/30' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}
                    >{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-20">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
               <p className="text-gray-400 font-bold">Hayvanlar getiriliyor...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
               <Info className="w-12 h-12 text-gray-200 mx-auto mb-3" />
               <p className="text-gray-400 font-bold text-lg">Eşleşen kayıt bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((animal) => {
                const img = getImageUrl(animal.id);
                return (
                  <div 
                    key={animal.id} 
                    onClick={() => navigate(`/animals/${animal.id}`)}
                    className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-200 transition-all group cursor-pointer"
                  >
                    <div className="relative w-full h-52 bg-gray-50 overflow-hidden">
                      <img src={img} alt={animal.name} 
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                           onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} 
                      />
                      <div className="w-full h-full flex flex-col items-center justify-center text-primary-200 hidden absolute inset-0">
                        <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-black text-3xl mb-2">
                          {(animal.name || '?')[0].toUpperCase()}
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                         <span className={`px-3 py-1 text-[10px] rounded-full font-black uppercase tracking-wider shadow-sm ${statusColor(animal.status)}`}>
                           {animal.status}
                         </span>
                         {animal.health === 'Hasta' && (
                           <span className="px-3 py-1 text-[10px] rounded-full font-black uppercase tracking-wider bg-red-600 text-white shadow-sm animate-pulse">
                             HASTA
                           </span>
                         )}
                      </div>
                      <button
                        onClick={(e) => handlePhotoClick(animal, e)}
                        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-2xl shadow-lg text-primary-600 hover:bg-primary-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-black text-gray-900 text-xl leading-tight">{animal.name}</h3>
                          <p className="text-sm text-primary-600 font-black tracking-widest mt-1">{animal.tagNumber}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEdit(animal, e); }} 
                            className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(animal, e); }} 
                            className="p-2.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-gray-50 rounded-2xl p-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">TÜR</p>
                            <p className="text-sm font-bold text-gray-700">{animal.type || 'Belirtilmedi'}</p>
                         </div>
                         <div className="bg-gray-50 rounded-2xl p-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">YAŞ</p>
                            <p className="text-sm font-bold text-gray-700">{animal.age ? `${animal.age} Yaş` : '-'}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                        <div className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {animal.health}</div>
                        <div className="w-1 h-1 bg-gray-200 rounded-full" />
                        <div className="flex items-center gap-1.5"><Baby className="w-3.5 h-3.5" /> {animal.breed}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900">{isEdit ? 'Hayvan Kartını Güncelle' : 'Yeni Hayvan Kaydı'}</h2>
              <button onClick={closeModal} className="p-3 text-gray-400 hover:text-red-500 hover:bg-white rounded-2xl transition-all shadow-sm">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={isEdit ? handleUpdate : handleSave} className="p-8 overflow-y-auto space-y-8">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                 <div className="flex flex-col items-center gap-4">
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="w-40 h-40 rounded-[2rem] border-4 border-dashed border-gray-100 hover:border-primary-400 cursor-pointer flex items-center justify-center bg-gray-50 hover:bg-primary-50 transition-all overflow-hidden group shadow-inner"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Önizleme" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-300 gap-2">
                          <Camera className="w-10 h-10 transition-transform group-hover:scale-110" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Fotoğraf Seç</span>
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                 </div>

                 <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Küpe Numarası *</label>
                      <input required value={form.tagNumber} onChange={e => setForm(p => ({ ...p, tagNumber: e.target.value.toUpperCase() }))}
                        placeholder="TR 00 000000"
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Hayvan İsmi *</label>
                      <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Örn: Sarıkız"
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Hayvan Türü</label>
                      <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 transition-all appearance-none">
                        {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Yaş (Tahmini)</label>
                      <input type="number" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                        placeholder="0"
                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    </div>
                 </div>
              </div>

              <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                 <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Baby className="w-4 h-4" /> Soy Bilgileri (Soy Ağacı)
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-emerald-600 uppercase mb-2">Anne Küpe No</label>
                      <input value={form.motherTag} onChange={e => setForm(p => ({ ...p, motherTag: e.target.value.toUpperCase() }))}
                        placeholder="Anne Küpe No Giriniz"
                        className="w-full bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-emerald-600 uppercase mb-2">Baba Küpe No</label>
                      <input value={form.fatherTag} onChange={e => setForm(p => ({ ...p, fatherTag: e.target.value.toUpperCase() }))}
                        placeholder="Baba Küpe No Giriniz"
                        className="w-full bg-white border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 transition-all" />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Irk</label>
                    <input value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4" />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Cinsiyet</label>
                    <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 appearance-none">
                      {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Durum</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 appearance-none">
                      {['Boş', 'Gebe', 'Kuruda'].map(s => <option key={s}>{s}</option>)}
                    </select>
                 </div>
              </div>

              {saveError && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold animate-shake">{saveError}</div>}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 bg-gray-50 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all">Vazgeç</button>
                <button type="submit" disabled={saving} className="flex-2 bg-primary-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                   {saving ? 'Kaydediliyor...' : <><Save className="w-5 h-5" /> {isEdit ? 'Değişiklikleri Kaydet' : 'Hayvanı Kaydet'}</>}
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
