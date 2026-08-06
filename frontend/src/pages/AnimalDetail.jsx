import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  ChevronLeft, Calendar, Heart, Baby, Info, 
  Activity, Tag, User, Hash, Clock, AlertCircle,
  FileText, History, Edit2, Trash2, Camera, X, Save,
  ArrowRight, Bell, Stethoscope, Droplet, Sparkles,
  CloudOff, AlertTriangle, Syringe, Plus, Flame
} from 'lucide-react';

const EVENT_TYPES = [
   { label: 'Doğum Yaptı', icon: <Baby size={20} className="text-gray-800" /> },
   { label: 'Gebelik Testi', icon: <Stethoscope size={20} className="text-gray-800" /> },
   { label: 'Kuruya Alındı', icon: <CloudOff size={20} className="text-gray-800" /> },
   { label: 'Tohumlama Yapıldı', icon: <Activity size={20} className="text-gray-800" /> },
   { label: 'Kızgınlık Görüldü', icon: <Flame size={20} className="text-red-500" /> },
   { label: 'Düşük Yaptı', icon: <AlertTriangle size={20} className="text-red-500" /> },
   { label: 'Hastalık / Tedavi', icon: <Activity size={20} className="text-gray-800" /> },
   { label: 'Aşı Yapıldı', icon: <Syringe size={20} className="text-gray-800" /> },
   { label: 'Kilo Ölçümü', icon: <Activity size={20} className="text-gray-800" /> },
   { label: 'Diğer', icon: <Calendar size={20} className="text-gray-800" /> }
];

const TYPE_OPTIONS = ['İnek', 'Düve', 'Tosun', 'Dana', 'Buzağı'];
const GENDER_OPTIONS = ['Dişi', 'Erkek'];

const AnimalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [offspring, setOffspring] = useState([]);
  
  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);

  // Event Modal States
  const [isEventModalVisible, setEventModalVisible] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
     title: '',
     description: '',
     date: new Date().toISOString().split('T')[0],
     time: '12:00',
     difficulty: 'Normal',
     bullName: '',
     inseminationType: 'Suni Tohum',
     pregnancyTestResult: 'Pozitif'
  });

  // Reminder Modal States
  const [isReminderModalVisible, setReminderModalVisible] = useState(false);
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({
     title: '',
     date: new Date().toISOString().split('T')[0],
     time: '12:00'
  });

  const [reminders, setReminders] = useState([]);
  
  const fetchDetail = async () => {
    try {
      const [animalRes, eventsRes, remindersRes] = await Promise.all([
        api.get(`/animals/${id}`),
        api.get(`/animals/${id}/events`),
        api.get(`/Reminders?animalId=${id}`)
      ]);
      setAnimal(animalRes.data);
      setEvents(eventsRes.data);
      
      const sortedReminders = remindersRes.data.sort((a, b) => new Date(a.reminderDate) - new Date(b.reminderDate));
      setReminders(sortedReminders);

      // Yavruları çek
      if (animalRes.data.tagNumber) {
        const offspringRes = await api.get(`/animals/${animalRes.data.tagNumber}/offspring`);
        setOffspring(offspringRes.data);
      }
      
      // Formu doldur
      const a = animalRes.data;
      setForm({
        tagNumber: a.tagNumber || '',
        name: a.name || '',
        breed: a.breed || '',
        gender: a.gender || 'Dişi',
        pregnancyStatus: a.pregnancyStatus || 'Boş',
        healthStatus: a.healthStatus || 'Sağlıklı',
        birthDate: a.birthDate ? a.birthDate.split('T')[0] : '',
        age: a.age?.toString() || '',
        type: a.type || 'İnek',
        motherTag: a.motherTag || '',
        fatherTag: a.fatherTag || '',
        milkStatus: a.milkStatus || 'Sağmal',
        notes: a.notes || ''
      });
      
      const baseUrl = api.defaults.baseURL.replace('/api', '');
      setImagePreview(`${baseUrl}/images/animals/${a.animalId}.jpg?t=${new Date().getTime()}`);

    } catch (err) {
      console.error('Detay hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Geçici önizleme
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // API'ye yükle
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/Animals/${id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      console.error('Fotoğraf yükleme hatası:', err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        userId: animal.userId,
        age: form.age ? parseInt(form.age) : null,
        isActive: true
      };
      await api.put(`/animals/${id}`, payload);
      setShowEditModal(false);
      fetchDetail();
    } catch (err) {
      alert('Güncelleme hatası oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu hayvanı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/animals/${id}`);
      navigate('/animals');
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim()) {
       alert('Olay Türü alanı boş bırakılamaz.');
       return;
    }
    setIsSavingEvent(true);
    try {
       let finalDesc = eventForm.description;
       if (eventForm.title === 'Doğum Yaptı') {
          finalDesc = eventForm.difficulty + (eventForm.description ? ' - ' + eventForm.description : '');
       } else if (eventForm.title.toLowerCase().includes('tohum')) {
          finalDesc = `${eventForm.inseminationType} - Boğa: ${eventForm.bullName}` + (eventForm.description ? '\n' + eventForm.description : '');
       } else if (eventForm.title === 'Gebelik Testi') {
          finalDesc = `Sonuç: ${eventForm.pregnancyTestResult}` + (eventForm.description ? '\n' + eventForm.description : '');
       }

       const eventDateStr = `${eventForm.date}T${eventForm.time}:00`;

       const eventResponse = await api.post(`/Animals/${id}/events`, {
          title: eventForm.title,
          description: finalDesc,
          eventDate: new Date(eventDateStr).toISOString(),
          eventTypeId: 1,
          createdByUserId: animal.userId || 1,
          performedBy: 'Kullanıcı',
          resultStatus: 'Tamamlandı'
       });

       const eventId = eventResponse.data?.eventId || 0;
       const titleLower = eventForm.title.toLowerCase();

       const isTohum = titleLower.includes('tohum');
       const isKizginlik = titleLower.includes('kızgınlık') || titleLower.includes('kizginlik');
       const isDusuk = titleLower.includes('düşük') || titleLower.includes('dusuk');
       const isDogum = titleLower.includes('doğum yaptı') || titleLower.includes('dogum yapti');

       if (isTohum || isKizginlik || isDusuk || isDogum || (eventForm.title === 'Gebelik Testi' && eventForm.pregnancyTestResult === 'Boş')) {
          const oldReminders = reminders.filter(r => r.reminderTitle.includes('Gebelik Kontrolü') || r.reminderTitle.includes('Doğum Bekleniyor'));
          for (const rem of oldReminders) {
             try { await api.delete(`/Reminders/${rem.reminderId}`); } catch(e) {}
          }
       }

       if (isTohum) {
          const checkDate = new Date(eventDateStr);
          checkDate.setDate(checkDate.getDate() + 35);
          if (checkDate > new Date()) {
             await api.post('/Reminders', {
                animalId: id,
                userId: animal.userId || 1,
                animalName: animal?.name || animal?.tagNumber || 'Bilinmeyen',
                eventId: eventId,
                reminderTitle: 'Gebelik Kontrolü: ' + animal.name,
                reminderDate: checkDate.toISOString(),
                priority: 'Yüksek',
                status: 'Bekliyor',
                isCompleted: false
             });
          }
          const calvingDate = new Date(eventDateStr);
          calvingDate.setDate(calvingDate.getDate() + 270);
          if (calvingDate > new Date()) {
             await api.post('/Reminders', {
                animalId: id,
                userId: animal.userId || 1,
                animalName: animal?.name || animal?.tagNumber || 'Bilinmeyen',
                eventId: eventId,
                reminderTitle: 'Doğum Bekleniyor: ' + animal.name,
                reminderDate: calvingDate.toISOString(),
                priority: 'Yüksek',
                status: 'Bekliyor',
                isCompleted: false
             });
          }
          alert('Tohumlama kaydedildi.\nEski bildirimler silindi, yenileri planlandı.');
       } else if (eventForm.title === 'Gebelik Testi') {
          const newStatus = eventForm.pregnancyTestResult === 'Pozitif' ? 'Gebe' : 'Boş';
          try { await api.put(`/Animals/${id}`, { ...animal, pregnancyStatus: newStatus }); } catch (err) {}
          alert(`Gebelik testi kaydedildi. Hayvanın durumu ${newStatus} olarak güncellendi.`);
       } else if (isKizginlik || isDusuk || isDogum) {
          try { await api.put(`/Animals/${id}`, { ...animal, pregnancyStatus: 'Boş' }); } catch (err) {}
          alert(`${eventForm.title} kaydedildi.\nBekleyen doğum/gebelik bildirimleri iptal edildi ve hayvan durumu 'Boş' yapıldı.`);
       } else {
          alert(`${eventForm.title} olayı kaydedildi.`);
       }

       setEventModalVisible(false);
       setEventForm({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '12:00', difficulty: 'Normal', bullName: '', inseminationType: 'Suni Tohum', pregnancyTestResult: 'Pozitif' });
       fetchDetail();
    } catch (error) {
       alert('Olay kaydedilemedi.');
    } finally {
       setIsSavingEvent(false);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!reminderForm.title.trim()) {
       alert('Bildirim başlığı boş olamaz.');
       return;
    }
    setIsSavingReminder(true);
    try {
       const reminderDateStr = `${reminderForm.date}T${reminderForm.time}:00`;
       await api.post('/Reminders', {
          animalId: id,
          userId: animal.userId || 1,
          animalName: animal?.name || animal?.tagNumber || 'Bilinmeyen',
          reminderTitle: reminderForm.title,
          reminderDate: new Date(reminderDateStr).toISOString(),
          priority: 'Normal',
          status: 'Bekliyor',
          isCompleted: false
       });
       setReminderModalVisible(false);
       setReminderForm({ title: '', date: new Date().toISOString().split('T')[0], time: '12:00' });
       fetchDetail();
    } catch (error) {
       alert('Bildirim kaydedilemedi.');
    } finally {
       setIsSavingReminder(false);
    }
  };

  const handleToggleReminder = async (rem) => {
    try {
       await api.put(`/Reminders/${rem.reminderId}`, {
          ...rem,
          isCompleted: !rem.isCompleted
       });
       fetchDetail();
    } catch (error) {
       alert('Durum güncellenemedi.');
    }
  };

  const handleDeleteReminder = async (remId) => {
    if (!window.confirm('Bu bildirimi silmek istediğinize emin misiniz?')) return;
    try {
       await api.delete(`/Reminders/${remId}`);
       fetchDetail();
    } catch (error) {
       alert('Bildirim silinemedi.');
    }
  };

  // Gebelik Hesaplama Mantığı
  const getPregnancyInfo = () => {
    if (animal?.pregnancyStatus !== 'Gebe') return null;
    
    // Tohumlama olayını bul (Title içinde 'tohum' geçen en son olay)
    const inseminationEvent = events.find(e => 
      e.title?.toLowerCase().includes('tohum') || 
      e.description?.toLowerCase().includes('tohum')
    );

    if (!inseminationEvent) return null;

    const inseminDate = new Date(inseminationEvent.eventDate);
    const today = new Date();
    const calvingDate = new Date(inseminDate);
    calvingDate.setDate(calvingDate.getDate() + 280); // 280 gün gebelik süresi

    const diffTime = Math.abs(today - inseminDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const remainingTime = calvingDate - today;
    const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

    return {
      date: inseminDate.toLocaleDateString('tr-TR'),
      currentDay: diffDays,
      calvingDate: calvingDate.toLocaleDateString('tr-TR'),
      daysLeft: remainingDays
    };
  };

  const pregInfo = getPregnancyInfo();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );

  if (!animal) return (
    <div className="p-8 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800">Hayvan bulunamadı.</h2>
      <button onClick={() => navigate('/animals')} className="mt-4 text-primary-600 font-bold underline">Listeye Geri Dön</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-fade-in pb-20">
      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

      {/* Geri Dönüş ve Aksiyonlar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button 
          onClick={() => navigate('/animals')}
          className="flex items-center gap-2 text-gray-500 hover:text-primary-600 font-black transition-colors group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-primary-200 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </div>
          LİSTEYE DÖN
        </button>
        <div className="flex gap-3">
           <button 
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 bg-white border border-gray-100 px-5 py-3 rounded-2xl text-gray-700 hover:text-primary-600 hover:border-primary-200 shadow-sm transition-all font-black uppercase text-xs tracking-widest"
           >
             <Edit2 className="w-4 h-4" /> Düzenle
           </button>
           <button 
            onClick={handleDelete}
            className="bg-white border border-red-50 p-3 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50 shadow-sm transition-all"
           >
             <Trash2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sol Sütun: Foto ve Durum */}
        <div className="lg:col-span-4 space-y-6">
          {/* Hayvan Kartı */}
          <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative h-80 bg-gray-50 group">
               <img src={imagePreview} alt={animal.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
               <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50 hidden absolute inset-0">
                  <span className="text-8xl font-black text-primary-100">{animal.name?.[0].toUpperCase()}</span>
               </div>
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => fileRef.current?.click()}
                    className="bg-white/90 p-4 rounded-full shadow-xl text-primary-600 hover:scale-110 transition-transform"
                  >
                    <Camera className="w-8 h-8" />
                  </button>
               </div>
               <div className="absolute top-6 left-6">
                 <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border-2 border-white ${animal.pregnancyStatus === 'Gebe' ? 'bg-green-500 text-white' : 'bg-primary-600 text-white'}`}>
                   {animal.pregnancyStatus}
                 </span>
               </div>
            </div>
            <div className="p-10 text-center">
               <h1 className="text-4xl font-black text-gray-900 mb-1 tracking-tight">{animal.name}</h1>
               <p className="text-primary-600 font-black tracking-[0.2em] text-xs mb-8">{animal.tagNumber}</p>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100/50">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">IRK</p>
                     <p className="text-sm font-black text-gray-800">{animal.breed || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100/50">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">CİNSİYET</p>
                     <p className="text-sm font-black text-gray-800">{animal.gender}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Akıllı Durum Kartı (Gebelik) */}
          {pregInfo ? (
            <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-[3rem] p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
               <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                  <Baby size={150} />
               </div>
               <div className="relative z-10">
                 <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                    <AlertCircle className="w-6 h-6" /> Gebelik Bilgisi
                 </h3>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-white/20 pb-4">
                       <span className="text-sm font-bold text-white/80">Tohumlama Tarihi</span>
                       <span className="font-black text-lg">{pregInfo.date}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-4">
                       <span className="text-sm font-bold text-white/80">Gebelik Süresi</span>
                       <span className="font-black text-lg">{pregInfo.currentDay}. Gün</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/20 pb-4">
                       <span className="text-sm font-bold text-white/80">Tahmini Doğum</span>
                       <span className="font-black text-lg">{pregInfo.calvingDate}</span>
                    </div>
                    <div className={`p-6 rounded-3xl mt-4 text-center border backdrop-blur-sm ${pregInfo.daysLeft < 0 ? 'bg-red-500/30 border-red-200/50' : 'bg-white/20 border-white/30'}`}>
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-1">
                          {pregInfo.daysLeft < 0 ? 'DOĞUM GECİKMESİ' : 'DOĞUMA KALAN'}
                       </p>
                       <p className="text-3xl font-black">
                          {pregInfo.daysLeft < 0 ? `${Math.abs(pregInfo.daysLeft)} GÜN GEÇTİ` : `${pregInfo.daysLeft} GÜN`}
                       </p>
                    </div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="bg-primary-600 rounded-[3rem] p-8 text-white shadow-xl shadow-primary-500/20">
               <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                  <Activity className="w-6 h-6" /> Sağlık Özeti
               </h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/10 p-5 rounded-3xl border border-white/10">
                     <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-rose-300" />
                        <span className="text-sm font-bold">Sağlık Durumu</span>
                     </div>
                     <span className="font-black uppercase tracking-widest text-sm">{animal.healthStatus}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 p-5 rounded-3xl border border-white/10">
                     <div className="flex items-center gap-3">
                        <Droplet className="w-5 h-5 text-blue-300" />
                        <span className="text-sm font-bold">Süt Verimi</span>
                     </div>
                     <span className="font-black uppercase tracking-widest text-sm">{animal.milkStatus}</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Sağ Sütun: Bilgiler, Notlar, Yavrular ve Geçmiş */}
        <div className="lg:col-span-8 space-y-8">
           {/* Detaylar ve Notlar */}
           <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-10">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                   <Info className="w-8 h-8 text-primary-500" /> Temel Bilgiler
                </h2>
                <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Sistem No: #{animal.animalId}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[1.2rem] flex items-center justify-center shadow-sm">
                       <Clock className="w-7 h-7" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">YAŞ</p>
                       <p className="text-lg font-black text-gray-800">{animal.age !== null ? `${animal.age} Yaşında` : 'Yeni Doğan'}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-[1.2rem] flex items-center justify-center shadow-sm">
                       <Tag className="w-7 h-7" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">HAYVAN TÜRÜ</p>
                       <p className="text-lg font-black text-gray-800">{animal.type || 'Belirtilmedi'}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.2rem] flex items-center justify-center shadow-sm">
                       <Calendar className="w-7 h-7" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">DOĞUM TARİHİ</p>
                       <p className="text-lg font-black text-gray-800">
                          {animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                       </p>
                    </div>
                 </div>

                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.2rem] flex items-center justify-center shadow-sm">
                       <Baby className="w-7 h-7" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">EBEVEYN</p>
                       <p className="text-lg font-black text-gray-800">{animal.motherTag || 'Kayıt Yok'}</p>
                    </div>
                 </div>
              </div>

              {/* Notlar Alanı */}
              <div className="mt-12 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                 <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-500" /> Hayvan Notları
                 </h3>
                 <p className="text-gray-600 font-medium leading-relaxed italic">
                    {animal.notes || "Bu hayvan için henüz bir not eklenmemiş."}
                 </p>
              </div>
           </div>

           {/* Buzağıları (Yavrular) Section */}
           <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                   <Baby className="w-8 h-8 text-rose-500" /> Buzağıları (Soy Ağacı)
                </h2>
                <button 
                  onClick={() => navigate('/animals', { state: { prefillMother: animal.tagNumber, showAdd: true } })}
                  className="flex items-center gap-2 bg-rose-50 text-rose-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
                >
                   <X className="w-4 h-4 rotate-45" /> YENİ BUZAĞI KAYDET
                </button>
              </div>
              
              {offspring.length === 0 ? (
                <div className="bg-gray-50/50 border-2 border-dashed border-gray-100 p-10 rounded-[2.5rem] text-center">
                   <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                   <p className="text-gray-400 font-black tracking-tight text-lg">Bu hayvanın henüz kayıtlı bir yavrusu bulunamadı.</p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 italic">Yeni bir doğum gerçekleştiyse sağ üstteki butondan kaydedebilirsiniz.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {offspring.map((kid) => (
                    <Link 
                      key={kid.animalId}
                      to={`/animals/${kid.animalId}`}
                      className="group flex items-center gap-4 p-4 bg-gray-50/50 hover:bg-white rounded-[2rem] border border-transparent hover:border-primary-100 hover:shadow-xl transition-all"
                    >
                      <div className="w-16 h-16 bg-white rounded-[1.2rem] flex items-center justify-center shadow-sm font-black text-primary-600 text-xl group-hover:scale-110 transition-transform">
                         {kid.name?.[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900">{kid.name}</p>
                        <p className="text-[10px] font-black text-primary-400 tracking-widest uppercase">{kid.tagNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400">{kid.type}</span>
                          <span className={`w-1 h-1 rounded-full ${kid.gender === 'Dişi' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                          <span className="text-[10px] font-bold text-gray-400">{kid.gender}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
           </div>

           {/* Bildirimler / Zaman Çizelgesi */}
           <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                 <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                    <Bell className="w-8 h-8 text-amber-500" /> Hayvan Bildirimleri & Geçmiş
                 </h2>
                 <button 
                   onClick={() => { setEventForm({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '12:00', difficulty: 'Normal', bullName: '', inseminationType: 'Suni Tohum', pregnancyTestResult: 'Pozitif' }); setEventModalVisible(true); }}
                   className="flex items-center gap-2 bg-amber-50 text-amber-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-100 shadow-sm"
                 >
                    <Plus className="w-4 h-4" /> YENİ DURUM EKLE
                 </button>
              </div>
              <div className="space-y-6 relative before:absolute before:left-7 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
                 {events.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 font-bold italic pl-10">Kayıtlı olay bulunamadı.</div>
                 ) : (
                    events.map((e, idx) => (
                       <div key={idx} className="flex items-start gap-8 group relative z-10">
                          <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-lg border-2 border-white shrink-0 transition-transform group-hover:scale-110
                            ${e.title?.toLowerCase().includes('tohum') ? 'bg-orange-500 text-white' : 
                              e.title?.toLowerCase().includes('aşı') ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white'}`}>
                             {e.title?.toLowerCase().includes('tohum') ? <Sparkles className="w-6 h-6" /> : 
                              e.title?.toLowerCase().includes('aşı') ? <Stethoscope className="w-6 h-6" /> : <History className="w-6 h-6" />}
                          </div>
                          <div className="flex-1 bg-gray-50/50 p-6 rounded-[2rem] border border-transparent group-hover:border-gray-100 group-hover:bg-white transition-all group-hover:shadow-xl relative">
                             <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={async () => {
                                   if (window.confirm('Bu olayı silmek istediğinize emin misiniz?')) {
                                      try {
                                         await api.delete(`/Animals/${id}/events/${e.eventId}`);
                                         fetchDetail();
                                      } catch(err) {
                                         alert('Silinirken hata oluştu.');
                                      }
                                   }
                                }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                             <div className="flex justify-between items-start mb-2 pr-10">
                                <p className="font-black text-gray-900 text-lg">{e.title}</p>
                                <span className="text-[10px] font-black text-primary-400 bg-white px-3 py-1 rounded-full shadow-sm">{new Date(e.eventDate).toLocaleDateString('tr-TR')}</span>
                             </div>
                             <p className="text-sm text-gray-500 font-medium leading-relaxed">{e.description}</p>
                             <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase">
                                   <Clock className="w-3 h-3" /> {new Date(e.eventDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary-500 uppercase">
                                   <User className="w-3 h-3" /> {e.performedBy || 'Veteriner'}
                                </div>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Hatırlatıcılar (Bildirimler) */}
           <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                 <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                    <Bell className="w-8 h-8 text-blue-500" /> Bildirimler
                 </h2>
                 <button 
                   onClick={() => { setReminderForm({ title: '', date: new Date().toISOString().split('T')[0], time: '12:00' }); setReminderModalVisible(true); }}
                   className="flex items-center gap-2 bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                 >
                    <Plus className="w-4 h-4" /> BİLDİRİM EKLE
                 </button>
              </div>
              <div className="space-y-4">
                 {reminders.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 font-bold italic">Kayıtlı bildirim yok.</div>
                 ) : (
                    reminders.map((rem, idx) => (
                       <div key={idx} className={`flex items-center p-6 rounded-[2rem] border transition-all ${rem.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-blue-100 hover:border-blue-300 shadow-sm hover:shadow-md'}`}>
                          <button 
                             onClick={() => handleToggleReminder(rem)}
                             className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mr-6 transition-colors ${rem.isCompleted ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-500'}`}
                          >
                             {rem.isCompleted ? <Sparkles className="w-6 h-6" /> : <div className="w-4 h-4 rounded-full border-2 border-current"></div>}
                          </button>
                          <div className="flex-1">
                             <h4 className={`text-lg font-black ${rem.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{rem.reminderTitle}</h4>
                             <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">
                                   <Calendar className="w-3 h-3" /> {new Date(rem.reminderDate).toLocaleDateString('tr-TR')}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase">
                                   <Clock className="w-3 h-3" /> {new Date(rem.reminderDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                             </div>
                          </div>
                          <button onClick={() => handleDeleteReminder(rem.reminderId)} className="w-10 h-10 rounded-xl flex items-center justify-center text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0">
                             <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* DÜZENLEME MODALI */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up border border-white/20">
            <div className="flex items-center justify-between p-10 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Kayıt Güncelle</h2>
              <button onClick={() => setShowEditModal(false)} className="p-4 text-gray-400 hover:text-red-500 hover:bg-white rounded-[1.5rem] transition-all shadow-sm">
                <X className="w-7 h-7" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-10 overflow-y-auto space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Küpe Numarası *</label>
                  <input required value={form.tagNumber} onChange={e => setForm(p => ({ ...p, tagNumber: e.target.value.toUpperCase() }))}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Hayvan İsmi *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Hayvan Türü</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none">
                    {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Gebelik Durumu</label>
                  <select value={form.pregnancyStatus} onChange={e => setForm(p => ({ ...p, pregnancyStatus: e.target.value }))}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none">
                    {['Gebe', 'Boş', 'Kuruda'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Doğum Tarihi</label>
                  <input type="date" value={form.birthDate} onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none" />
                </div>
              </div>

              {/* Notlar Düzenleme */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Özel Notlar & Sigorta Bilgisi</label>
                <textarea 
                  value={form.notes} 
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Sigorta bilgisi, özel bakım notları..."
                  className="w-full bg-gray-50 border-2 border-transparent rounded-[2rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none min-h-[120px] resize-none"
                />
              </div>

              <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border-2 border-emerald-100/50">
                 <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <Baby className="w-5 h-5" /> Soy Bilgileri (Ebeveyn Kaydı)
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-emerald-600 uppercase mb-3">Anne Küpe No</label>
                      <input value={form.motherTag} onChange={e => setForm(p => ({ ...p, motherTag: e.target.value.toUpperCase() }))}
                        className="w-full bg-white border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-emerald-600 uppercase mb-3">Baba Küpe No</label>
                      <input value={form.fatherTag} onChange={e => setForm(p => ({ ...p, fatherTag: e.target.value.toUpperCase() }))}
                        className="w-full bg-white border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none" />
                    </div>
                 </div>
              </div>

              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">İPTAL</button>
                <button type="submit" disabled={saving} className="flex-[2] bg-primary-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all flex items-center justify-center gap-3">
                   {saving ? 'KAYDEDİLİYOR...' : <><Save className="w-5 h-5" /> GÜNCELLEMEYİ TAMAMLA</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* OLAY EKLEME MODALI */}
      {isEventModalVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up border border-white/20">
            <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Durum Ekle</h2>
              <button onClick={() => setEventModalVisible(false)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-8 overflow-y-auto space-y-6">
              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Durum Tipi *</label>
                 <select 
                    required 
                    value={eventForm.title} 
                    onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none"
                 >
                    <option value="" disabled>Durum Seçin</option>
                    {EVENT_TYPES.map((opt, i) => <option key={i} value={opt.label}>{opt.label}</option>)}
                    <option value="Diğer">Diğer (Kendin Yaz)</option>
                 </select>
              </div>

              {(!EVENT_TYPES.find(e => e.label === eventForm.title) && eventForm.title !== '') && (
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Özel Durum Adı *</label>
                    <input 
                       required 
                       value={eventForm.title === 'Diğer' ? '' : eventForm.title} 
                       onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))}
                       placeholder="Olay Türü (Kendiniz yazın)"
                       className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none"
                    />
                 </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Durum Tarihi *</label>
                    <input 
                       type="date" 
                       required 
                       value={eventForm.date} 
                       onChange={e => setEventForm(p => ({ ...p, date: e.target.value }))}
                       className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Durum Saati *</label>
                    <input 
                       type="time" 
                       required 
                       value={eventForm.time} 
                       onChange={e => setEventForm(p => ({ ...p, time: e.target.value }))}
                       className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none"
                    />
                 </div>
              </div>

              {eventForm.title === 'Doğum Yaptı' && (
                 <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100/50">
                    <label className="block text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-3">Doğum Zorluğu</label>
                    <select 
                       value={eventForm.difficulty} 
                       onChange={e => setEventForm(p => ({ ...p, difficulty: e.target.value }))}
                       className="w-full bg-white border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                    >
                       <option>Normal</option>
                       <option>Zor</option>
                       <option>Ölü</option>
                    </select>
                 </div>
              )}

              {eventForm.title === 'Gebelik Testi' && (
                 <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50">
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-3">Test Sonucu</label>
                    <select 
                       value={eventForm.pregnancyTestResult} 
                       onChange={e => setEventForm(p => ({ ...p, pregnancyTestResult: e.target.value }))}
                       className="w-full bg-white border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    >
                       <option>Pozitif</option>
                       <option>Negatif</option>
                    </select>
                    <p className="text-xs text-blue-500 mt-3 font-semibold">
                       Hayvanın gebelik durumu sonuca göre "Gebe" veya "Boş" olarak otomatik güncellenecektir.
                    </p>
                 </div>
              )}

              {eventForm.title?.toLowerCase().includes('tohum') && (
                 <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100/50 space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-3">Tohumlama Tipi</label>
                       <select 
                          value={eventForm.inseminationType} 
                          onChange={e => setEventForm(p => ({ ...p, inseminationType: e.target.value }))}
                          className="w-full bg-white border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                       >
                          <option>Suni Tohum</option>
                          <option>Tabii Tohum</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-3">Boğa Adı / Kodu</label>
                       <input 
                          value={eventForm.bullName} 
                          onChange={e => setEventForm(p => ({ ...p, bullName: e.target.value }))}
                          placeholder="Boğa adı veya kayıt kodu"
                          className="w-full bg-white border-none rounded-[1.5rem] px-6 py-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                       />
                    </div>
                 </div>
              )}

              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Açıklama (İsteğe Bağlı)</label>
                 <textarea 
                    value={eventForm.description} 
                    onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Eklemek istediğiniz notlar..."
                    className="w-full bg-gray-50 border-2 border-transparent rounded-[2rem] px-6 py-5 text-sm font-bold focus:bg-white focus:border-primary-500 transition-all outline-none min-h-[100px] resize-none"
                 />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEventModalVisible(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">İPTAL</button>
                <button type="submit" disabled={isSavingEvent} className="flex-[2] bg-primary-600 text-white py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary-500/40 hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                   {isSavingEvent ? 'KAYDEDİLİYOR...' : <><Save className="w-5 h-5" /> DURUMU KAYDET</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BİLDİRİM EKLEME MODALI */}
      {isReminderModalVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up border border-white/20">
            <div className="flex items-center justify-between p-8 border-b border-blue-50 bg-blue-50/50">
              <h2 className="text-2xl font-black text-blue-900 tracking-tight">Bildirim Ekle</h2>
              <button onClick={() => setReminderModalVisible(false)} className="p-3 text-blue-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="p-8 overflow-y-auto space-y-6">
              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Bildirim Başlığı / Notu *</label>
                 <input 
                    required 
                    value={reminderForm.title} 
                    onChange={e => setReminderForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Örn: Doğum yaklaştı..."
                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                 />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Hatırlatma Tarihi *</label>
                    <input 
                       type="date" 
                       required 
                       value={reminderForm.date} 
                       onChange={e => setReminderForm(p => ({ ...p, date: e.target.value }))}
                       className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Hatırlatma Saati *</label>
                    <input 
                       type="time" 
                       required 
                       value={reminderForm.time} 
                       onChange={e => setReminderForm(p => ({ ...p, time: e.target.value }))}
                       className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                    />
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setReminderModalVisible(false)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">İPTAL</button>
                <button type="submit" disabled={isSavingReminder} className="flex-[2] bg-blue-600 text-white py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                   {isSavingReminder ? 'KAYDEDİLİYOR...' : <><Save className="w-5 h-5" /> KAYDET</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalDetail;
