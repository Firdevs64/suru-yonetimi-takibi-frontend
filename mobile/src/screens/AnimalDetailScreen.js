import React, { useState, useEffect } from 'react';
// import * as Notifications from 'expo-notifications'; // Removed due to Expo Go SDK 53 conflict
import {
   StyleSheet,
   View,
   Text,
   ScrollView,
   Image,
   TouchableOpacity,
   ActivityIndicator,
   Modal,
   TextInput,
   Alert,
   Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
   ChevronLeft, Calendar, Heart, Baby, Info,
   Activity, Tag, Clock, History, Edit3, Trash2,
   Camera, X, Save, AlertTriangle, Bell, Droplet, Sparkles, ChevronRight, Plus, CloudOff, Syringe, ChevronDown, Stethoscope, Flame
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api/axios';

const { width } = Dimensions.get('window');

export default function AnimalDetailScreen({ route, navigation }) {
   const { animalId } = route.params;
   const [animal, setAnimal] = useState(null);
   const [events, setEvents] = useState([]);
   const [offspring, setOffspring] = useState([]);
   const [reminders, setReminders] = useState([]);

   const [isAddCalfModalVisible, setAddCalfModalVisible] = useState(false);
   const [savingCalf, setSavingCalf] = useState(false);
   const [calfForm, setCalfForm] = useState({
      name: '', tagNumber: '', gender: 'Dişi', type: 'Buzağı', birthDate: '', breed: '', fatherTag: '', notes: ''
   });
   const [showCalfDatePicker, setShowCalfDatePicker] = useState(false);

   const handleSaveCalf = async () => {
      if (!calfForm.tagNumber || !calfForm.name) {
         Alert.alert('Eksik Bilgi', 'İsim ve Küpe No zorunludur.');
         return;
      }
      setSavingCalf(true);
      try {
         const payload = {
            userId: animal.userId,
            tagNumber: calfForm.tagNumber,
            name: calfForm.name,
            breed: calfForm.breed,
            gender: calfForm.gender,
            type: calfForm.type,
            motherTag: animal.tagNumber,
            fatherTag: calfForm.fatherTag,
            pregnancyStatus: 'Boş',
            healthStatus: 'Sağlıklı',
            birthDate: calfForm.birthDate || null,
            notes: calfForm.notes,
            isActive: true
         };
         await api.post('/Animals', payload);
         setAddCalfModalVisible(false);
         setCalfForm({ name: '', tagNumber: '', gender: 'Dişi', type: 'Buzağı', birthDate: '', breed: '', fatherTag: '', notes: '' });
         fetchDetail();
      } catch (error) {
         Alert.alert('Hata', 'Buzağı eklenirken bir sorun oluştu.');
      } finally {
         setSavingCalf(false);
      }
   };
   const [loading, setLoading] = useState(true);

   const [isEditModalVisible, setEditModalVisible] = useState(false);
   const [editForm, setEditForm] = useState({});
   const [isSaving, setIsSaving] = useState(false);
   const [animalImage, setAnimalImage] = useState(null);

   // Olay ekleme
   const [isEventModalVisible, setEventModalVisible] = useState(false);
   const [eventForm, setEventForm] = useState({
      title: '',
      description: '',
      date: new Date(),
      time: new Date(),
      difficulty: 'Normal',
      bullName: '',
      inseminationType: 'Suni Tohum'
   });
   const [editEventId, setEditEventId] = useState(null);
   const [isSavingEvent, setIsSavingEvent] = useState(false);
   const [showEventDropdown, setShowEventDropdown] = useState(false);

   const [showEditDatePicker, setShowEditDatePicker] = useState(false);
   const [showEventDatePicker, setShowEventDatePicker] = useState(false);
   const [eventDatePickerMode, setEventDatePickerMode] = useState('date');
   const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
   const [isReminderModalVisible, setReminderModalVisible] = useState(false);
   const [isSavingReminder, setIsSavingReminder] = useState(false);
   const [reminderForm, setReminderForm] = useState({ title: '', date: new Date() });

   const EVENT_TYPES = [
      { label: 'Doğum Yaptı', icon: <Baby size={20} color="#1F2937" /> },
      { label: 'Gebelik Testi', icon: <Stethoscope size={20} color="#1F2937" /> },
      { label: 'Kuruya Alındı', icon: <CloudOff size={20} color="#1F2937" /> },
      { label: 'Tohumlama Yapıldı', icon: <Activity size={20} color="#1F2937" /> },
      { label: 'Kızgınlık Görüldü', icon: <Flame size={20} color="#EF4444" /> },
      { label: 'Düşük Yaptı', icon: <AlertTriangle size={20} color="#EF4444" /> },
      { label: 'Hastalık / Tedavi', icon: <Activity size={20} color="#1F2937" /> },
      { label: 'Aşı Yapıldı', icon: <Syringe size={20} color="#1F2937" /> },
      { label: 'Kilo Ölçümü', icon: <Activity size={20} color="#1F2937" /> },
      { label: 'Diğer', icon: <Calendar size={20} color="#1F2937" /> }
   ];

   const scheduleNotification = async (title, body, targetDate) => {
      // Push bildirimleri Expo Go'da SDK 53 ile kaldirildi. 
      // Bildirimler zaten backend ve NotificationsScreen uzerinden calisiyor.
   };

   const fetchDetail = async () => {
      try {
         const [animalRes, eventsRes, remindersRes] = await Promise.all([
            api.get(`/Animals/${animalId}`),
            api.get(`/Animals/${animalId}/events`),
            api.get(`/Reminders?animalId=${animalId}`)
         ]);
         const data = animalRes.data;
         setAnimal(data);
         setEvents(eventsRes.data);

         const sortedReminders = remindersRes.data.sort((a, b) => new Date(a.reminderDate) - new Date(b.reminderDate));
         setReminders(sortedReminders);

         if (data.tagNumber) {
            const offspringRes = await api.get(`/Animals/${data.tagNumber}/offspring`);
            setOffspring(offspringRes.data);
         }

         setEditForm({
            name: data.name,
            tagNumber: data.tagNumber,
            type: data.type || 'İnek',
            breed: data.breed || '',
            motherTag: data.motherTag || '',
            fatherTag: data.fatherTag || '',
            birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
            gender: data.gender || 'Dişi',
            pregnancyStatus: data.pregnancyStatus || 'Boş',
            healthStatus: data.healthStatus || 'Sağlıklı',
            milkStatus: data.milkStatus || 'Yok',
            notes: data.notes || ''
         });

         const baseUrl = api.defaults.baseURL.replace('/api', '');
         setAnimalImage(`${baseUrl}/images/animals/${animalId}.jpg?t=${new Date().getTime()}`);


      } catch (error) {
         console.error('Hayvan detayi cekilemedi:', error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchDetail();
   }, [animalId]);

   const pickImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
         Alert.alert('Izin Gerekli', 'Galeriye erisim izni vermeniz gerekiyor.');
         return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
         allowsEditing: true,
         aspect: [4, 3],
         quality: 0.7,
      });
      if (!result.canceled) {
         const uri = result.assets[0].uri;
         setAnimalImage(uri);

         const filename = uri.split('/').pop();
         const match = /\.(\w+)$/.exec(filename);
         const type = match ? `image/${match[1]}` : `image`;

         const formData = new FormData();
         formData.append('file', {
            uri,
            name: filename,
            type
         });

         try {
            await api.post(`/Animals/${animalId}/upload-image`, formData, {
               headers: { 'Content-Type': 'multipart/form-data' }
            });
         } catch (e) {
            console.error('Fotoğraf API yükleme hatası', e);
         }
         fetchDetail();
      }
   };

   const getPregnancyInfo = () => {
      if (animal?.pregnancyStatus !== 'Gebe') return null;
      const inseminEvent = events.find(e =>
         e.title?.toLowerCase().includes('tohum') ||
         e.description?.toLowerCase().includes('tohum')
      );
      if (!inseminEvent) return null;
      const inseminDate = new Date(inseminEvent.eventDate);
      const today = new Date();
      const calvingDate = new Date(inseminDate);
      calvingDate.setDate(calvingDate.getDate() + 280);
      const diffDays = Math.ceil(Math.abs(today - inseminDate) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((calvingDate - today) / (1000 * 60 * 60 * 24));
      return {
         date: inseminDate.toLocaleDateString('tr-TR'),
         currentDay: diffDays,
         calvingDate: calvingDate.toLocaleDateString('tr-TR'),
         daysLeft: remainingDays
      };
   };

   const handleAddEvent = async () => {
      if (!eventForm.title.trim()) {
         Alert.alert('Uyarı', 'Olay Türü alanı boş bırakılamaz.');
         return;
      }
      setIsSavingEvent(true);
      try {
         // Açıklama oluşturma
         let finalDesc = eventForm.description;
         if (eventForm.title === 'Doğum Yaptı') {
            finalDesc = eventForm.difficulty + (eventForm.description ? ' - ' + eventForm.description : '');
         } else if (eventForm.title.toLowerCase().includes('tohum')) {
            finalDesc = `${eventForm.inseminationType} - Boğa: ${eventForm.bullName}` + (eventForm.description ? '\n' + eventForm.description : '');
         } else if (eventForm.title === 'Gebelik Testi') {
            finalDesc = `Sonuç: ${eventForm.pregnancyTestResult}` + (eventForm.description ? '\n' + eventForm.description : '');
         }

         const finalEventDate = new Date(eventForm.date);
         finalEventDate.setHours(eventForm.time.getHours());
         finalEventDate.setMinutes(eventForm.time.getMinutes());

         let eventResponse;
         if (editEventId) {
            eventResponse = await api.put(`/Animals/${animalId}/events/${editEventId}`, {
               title: eventForm.title,
               description: finalDesc,
               eventDate: finalEventDate.toISOString(),
               eventTypeId: 1,
               createdByUserId: animal.userId || 1,
               performedBy: 'Kullanıcı',
               resultStatus: 'Tamamlandı'
            });
         } else {
            eventResponse = await api.post(`/Animals/${animalId}/events`, {
               title: eventForm.title,
               description: finalDesc,
               eventDate: finalEventDate.toISOString(),
               eventTypeId: 1,
               createdByUserId: animal.userId || 1,
               performedBy: 'Kullanıcı',
               resultStatus: 'Tamamlandı'
            });
         }

         const eventId = eventResponse.data?.eventId || 0;
         const titleLower = eventForm.title.toLowerCase();

         const isTohum = titleLower.includes('tohum');
         const isKizginlik = titleLower.includes('kızgınlık') || titleLower.includes('kizginlik');
         const isDusuk = titleLower.includes('düşük') || titleLower.includes('dusuk');
         const isDogum = titleLower.includes('doğum yaptı') || titleLower.includes('dogum yapti');

         if (isTohum || isKizginlik || isDusuk || isDogum || (eventForm.title === 'Gebelik Testi' && eventForm.pregnancyTestResult === 'Boş')) {
            const oldReminders = reminders.filter(r => r.reminderTitle.includes('Gebelik Kontrolü') || r.reminderTitle.includes('Doğum Bekleniyor'));
            for (const rem of oldReminders) {
               try { await api.delete(`/Reminders/${rem.reminderId}`); } catch (e) { }
            }
         }

         if (isTohum) {
            const checkDate = new Date(eventForm.date);
            checkDate.setDate(checkDate.getDate() + 35);

            if (checkDate > new Date()) {
               await api.post('/Reminders', {
                  animalId: animalId,
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

            const calvingDate = new Date(eventForm.date);
            calvingDate.setDate(calvingDate.getDate() + 270);

            if (calvingDate > new Date()) {
               await api.post('/Reminders', {
                  animalId: animalId,
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

            Alert.alert('Kaydedildi', 'Tohumlama kaydedildi.\nEski bildirimler silindi, yenileri planlandı.');
         } else if (eventForm.title === 'Gebelik Testi') {
            const newStatus = eventForm.pregnancyTestResult === 'Pozitif' ? 'Gebe' : 'Boş';
            try { await api.put(`/Animals/${animalId}`, { ...animal, pregnancyStatus: newStatus }); } catch (err) { }
            Alert.alert('Kaydedildi', `Gebelik testi kaydedildi. Hayvanın durumu ${newStatus} olarak güncellendi.`);
         } else if (isKizginlik || isDusuk || isDogum) {
            try { await api.put(`/Animals/${animalId}`, { ...animal, pregnancyStatus: 'Boş' }); } catch (err) { }
            Alert.alert('Kaydedildi', `${eventForm.title} kaydedildi.\nBekleyen doğum/gebelik bildirimleri iptal edildi ve hayvan durumu 'Boş' yapıldı.`);
         } else {
            Alert.alert('Kaydedildi', `${eventForm.title} olayı kaydedildi.`);
         }

         setEventModalVisible(false);
         setEditEventId(null);
         setEventForm({ title: '', description: '', date: new Date(), time: new Date(), difficulty: 'Normal', bullName: '', inseminationType: 'Suni Tohum', pregnancyTestResult: 'Pozitif' });
         fetchDetail();
      } catch (error) {
         Alert.alert('Hata', 'Olay kaydedilemedi/güncellenemedi.');
      } finally {
         setIsSavingEvent(false);
      }
   };

   const handleAddReminder = async () => {
      if (!reminderForm.title.trim()) {
         Alert.alert('Uyarı', 'Bildirim başlığı boş olamaz.');
         return;
      }
      setIsSavingReminder(true);
      try {
         await api.post('/Reminders', {
            animalId: animalId,
            userId: animal.userId || 1,
            animalName: animal?.name || animal?.tagNumber || 'Bilinmeyen',
            reminderTitle: reminderForm.title,
            reminderDate: reminderForm.date.toISOString(),
            priority: 'Normal',
            status: 'Bekliyor',
            isCompleted: false
         });
         setReminderModalVisible(false);
         setReminderForm({ title: '', date: new Date() });
         fetchDetail();
      } catch (error) {
         Alert.alert('Hata', 'Bildirim kaydedilemedi.');
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
      } catch (e) {
         Alert.alert('Hata', 'Durum güncellenemedi.');
      }
   };

   const handleDeleteReminder = async (id) => {
      Alert.alert('Sil', 'Bu bildirimi silmek istediğinize emin misiniz?', [
         { text: 'İptal', style: 'cancel' },
         {
            text: 'Sil', style: 'destructive', onPress: async () => {
               try {
                  await api.delete(`/Reminders/${id}`);
                  fetchDetail();
               } catch (e) {
                  Alert.alert('Hata', 'Bildirim silinemedi.');
               }
            }
         }
      ]);
   };

   const handleUpdate = async () => {
      setIsSaving(true);
      try {
         await api.put(`/Animals/${animalId}`, {
            ...editForm,
            userId: animal.userId,
            isActive: true
         });
         setEditModalVisible(false);
         fetchDetail();
         Alert.alert('Basarili', 'Hayvan bilgileri guncellendi.');
      } catch (error) {
         Alert.alert('Hata', 'Guncelleme yapilamadi.');
      } finally {
         setIsSaving(false);
      }
   };

   const handleDeleteAnimal = () => {
      Alert.alert('Sil', `"${animal.name}" isimli hayvani silmek istediginize emin misiniz?`, [
         { text: 'Vazgeç', style: 'cancel' },
         {
            text: 'Sil', style: 'destructive', onPress: async () => {
               try {
                  await api.delete(`/Animals/${animalId}`);
                  Alert.alert('Başarılı', 'Hayvan silindi.');
                  navigation.goBack();
               } catch (error) {
                  Alert.alert('Hata', 'Hayvan silinemedi.');
               }
            }
         }
      ]);
   };

   const pregInfo = getPregnancyInfo();

   if (loading) {
      return (
         <View style={styles.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
         </View>
      );
   }

   if (!animal) return null;

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
               <ChevronLeft size={24} color="#1d1d1f" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{animal.tagNumber}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
               <TouchableOpacity onPress={handleDeleteAnimal} style={[styles.editButton, { backgroundColor: '#FEE2E2', marginRight: 0 }]}>
                  <Trash2 size={20} color="#EF4444" />
               </TouchableOpacity>
               <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.editButton}>
                  <Edit3 size={20} color="#3B82F6" />
               </TouchableOpacity>
            </View>
         </View>

         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Gorsel Bolumu */}
            <View style={styles.imageSection}>
               <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                  <View style={styles.imageCard}>
                     {animalImage ? (
                        <Image source={{ uri: animalImage }} style={styles.mainImage} />
                     ) : (
                        <View style={styles.placeholderImage}>
                           <Text style={styles.placeholderText}>{animal.name?.[0].toUpperCase()}</Text>
                        </View>
                     )}
                  </View>
                  <View style={[styles.imageCard, styles.addImageCard]}>
                     <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center' }}>
                        <X size={40} color="#CBD5E1" style={{ transform: [{ rotate: '45deg' }] }} />
                        <Text style={styles.addImageText}>+Resim Ekle</Text>
                     </TouchableOpacity>
                  </View>
               </ScrollView>
               <View style={styles.topBadge}>
                  <Sparkles size={14} color="#F59E0B" />
               </View>
            </View>

            <View style={styles.content}>
               {/* Gebelik Bilgisi */}
               {pregInfo && (
                  <View style={styles.statusCard}>
                     <View style={styles.statusHeader}>
                        <Text style={styles.statusTitle}>Durum Bilgisi</Text>
                        <TouchableOpacity style={styles.statusArrow}>
                           <ChevronRight size={20} color="#FFF" />
                        </TouchableOpacity>
                     </View>
                     <View style={styles.statusRow}>
                        <View style={styles.pregIconBox}>
                           <Baby size={24} color="#F43F5E" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                           <Text style={styles.pregLabel}>Gebelik Bilgi</Text>
                           <Text style={styles.pregSub}>Tohumlama Tarihi: {pregInfo.date}</Text>
                           <Text style={styles.pregSub}>Gebelik Süresi: <Text style={{ fontWeight: '900', color: '#1d1d1f' }}>{pregInfo.currentDay}. gün</Text></Text>
                           <Text style={styles.pregSub}>Doğum Zamanı: {pregInfo.calvingDate}</Text>
                           <Text style={styles.pregSub}>
                              ({pregInfo.daysLeft < 0 ? `${Math.abs(pregInfo.daysLeft)} gün gecikti` : `${pregInfo.daysLeft} gün kaldı`})
                           </Text>
                        </View>
                     </View>
                     <View style={styles.warningBox}>
                        <AlertTriangle size={24} color="#B45309" />
                        <Text style={styles.warningText}>
                           ({pregInfo.currentDay}. gün) {pregInfo.daysLeft < 0 ? `Doğum zamanı ${Math.abs(pregInfo.daysLeft)} gün geçti!` : `Doğuma kalan tahmini süre: ${pregInfo.daysLeft} gün`}
                        </Text>
                     </View>
                  </View>
               )}

               {/* Temel Bilgiler */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <ChevronLeft size={20} color="#1d1d1f" style={{ transform: [{ rotate: '-90deg' }] }} />
                     <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
                     <TouchableOpacity style={styles.editCircle} onPress={() => setEditModalVisible(true)}>
                        <Edit3 size={16} color="#FFF" />
                     </TouchableOpacity>
                  </View>

                  <View style={styles.infoGrid}>
                     <InfoItem label="Kupe Nu" value={animal.tagNumber} color="#0D9488" />
                     <InfoItem label="Ismi" value={animal.name} color="#0D9488" />
                     <InfoItem label="Cinsiyeti" value={animal.gender} color="#0D9488" />
                     <InfoItem label="Irki" value={animal.breed} color="#0D9488" />
                     <InfoItem label="Dogum Tarihi" value={animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('tr-TR') : '-'} color="#0D9488" />
                     <InfoItem label="Yasi" value={animal.age !== null ? `${animal.age} Yas` : 'Hesaplanamadi'} color="#0D9488" />
                     <InfoItem label="Anne kupe nu" value={animal.motherTag || 'Kayit Yok'} color="#0D9488" />
                     <InfoItem label="Baba kupe nu" value={animal.fatherTag || 'Kayit Yok'} color="#0D9488" />
                     <InfoItem label="Notlar" value={animal.notes || 'Not bulunmuyor'} color="#0D9488" isLast />
                  </View>
               </View>

               {/* Durum Bilgileri */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <ChevronLeft size={20} color="#1d1d1f" style={{ transform: [{ rotate: '-90deg' }] }} />
                     <Text style={styles.sectionTitle}>Durum Bilgileri</Text>
                     <TouchableOpacity style={styles.addCircle} onPress={() => { setEditEventId(null); setEventForm({ title: '', description: '', date: new Date(), time: new Date(), difficulty: 'Normal', bullName: '', inseminationType: 'Suni Tohum', pregnancyTestResult: 'Pozitif' }); setEventModalVisible(true); }}>
                        <Plus size={16} color="#FFF" />
                     </TouchableOpacity>
                  </View>
                  {events.length === 0 ? (
                     <Text style={{ color: '#9CA3AF', padding: 10, textAlign: 'center' }}>Kayıtlı durum bilgisi yok.</Text>
                  ) : (
                     events.map((e, i) => {
                        const evtIcon = EVENT_TYPES.find(t => t.label === e.title)?.icon || <Sparkles size={24} color="#4B5563" />;
                        return (
                           <TouchableOpacity
                              key={i}
                              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
                              onPress={() => Alert.alert(
                                 'İşlem Seç',
                                 `${e.title} olayını düzenlemek veya silmek istiyor musunuz?`,
                                 [
                                    { text: 'İptal', style: 'cancel' },
                                    {
                                       text: 'Düzenle', onPress: () => {
                                          let parsedDifficulty = 'Normal';
                                          let parsedBullName = '';
                                          let parsedInsemType = 'Suni Tohum';
                                          let baseDesc = e.description || '';

                                          if (e.title === 'Doğum Yaptı') {
                                             if (baseDesc.startsWith('Normal') || baseDesc.startsWith('Zor') || baseDesc.startsWith('Ölü')) {
                                                const parts = baseDesc.split(' - ');
                                                parsedDifficulty = parts[0];
                                                baseDesc = parts.slice(1).join(' - ');
                                             }
                                          } else if (e.title === 'Tohumlama Yapıldı') {
                                             if (baseDesc) {
                                                const typeMatch = baseDesc.match(/^(Suni Tohum|Tabii Tohum)/);
                                                if (typeMatch) {
                                                   parsedInsemType = typeMatch[1];
                                                   baseDesc = baseDesc.replace(typeMatch[1], '').trim();
                                                }
                                                const bullMatch = baseDesc.match(/^\((.*?)\)/);
                                                if (bullMatch) {
                                                   parsedBullName = bullMatch[1];
                                                   baseDesc = baseDesc.replace(`(${parsedBullName})`, '').trim();
                                                }
                                                if (baseDesc.startsWith('-')) baseDesc = baseDesc.replace(/^-/, '').trim();
                                                if (!typeMatch && !bullMatch) {
                                                   const parts = baseDesc.split(' - ');
                                                   parsedBullName = parts[0];
                                                   baseDesc = parts.slice(1).join(' - ');
                                                }
                                             }
                                          }

                                          setEditEventId(e.eventId);
                                          setEventForm({
                                             title: e.title,
                                             description: baseDesc,
                                             date: new Date(e.eventDate),
                                             time: new Date(e.eventDate),
                                             difficulty: parsedDifficulty,
                                             bullName: parsedBullName,
                                             inseminationType: parsedInsemType
                                          });
                                          setEventModalVisible(true);
                                       }
                                    },
                                    {
                                       text: 'Sil', style: 'destructive', onPress: () => {
                                          Alert.alert('Emin misiniz?', 'Bu olayı silmek istediğinize emin misiniz?', [
                                             { text: 'İptal', style: 'cancel' },
                                             {
                                                text: 'Sil', style: 'destructive', onPress: async () => {
                                                   try {
                                                      await api.delete(`/Animals/${animalId}/events/${e.eventId}`);
                                                      fetchDetail();
                                                   } catch (err) {
                                                      Alert.alert('Hata', 'Olay silinemedi.');
                                                   }
                                                }
                                             }
                                          ]);
                                       }
                                    }
                                 ]
                              )}
                           >
                              <View style={{ marginRight: 12 }}>
                                 {evtIcon}
                              </View>
                              <View style={{ flex: 1 }}>
                                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>{e.title}</Text>
                                    <View style={{ marginLeft: 6, backgroundColor: '#E0F2FE', borderRadius: 10, padding: 2 }}>
                                       <Activity size={12} color="#0284C7" />
                                    </View>
                                 </View>
                                 {e.description ? <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>{e.description}</Text> : null}
                              </View>
                              <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden', alignItems: 'center', width: 55 }}>
                                 <Text style={{ fontSize: 10, color: '#6B7280', paddingVertical: 2 }}>{new Date(e.eventDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
                                 <Text style={{ fontSize: 16, fontWeight: '800', color: '#1F2937' }}>{new Date(e.eventDate).getDate()}</Text>
                                 <View style={{ backgroundColor: '#FF5722', width: '100%', alignItems: 'center', paddingVertical: 2 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>
                                       {new Date(e.eventDate).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })}
                                    </Text>
                                 </View>
                              </View>
                           </TouchableOpacity>
                        );
                     })
                  )}
               </View>

               {/* Bildirimler */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <ChevronLeft size={20} color="#1d1d1f" style={{ transform: [{ rotate: '-90deg' }] }} />
                     <Text style={styles.sectionTitle}>Bildirimler</Text>
                     <TouchableOpacity style={styles.addCircle} onPress={() => setReminderModalVisible(true)}>
                        <Plus size={16} color="#FFF" />
                     </TouchableOpacity>
                  </View>
                  {reminders.length === 0 ? (
                     <Text style={{ color: '#9CA3AF', padding: 10, textAlign: 'center' }}>Kayıtlı bildirim yok.</Text>
                  ) : (
                     reminders.map((rem, i) => (
                        <TouchableOpacity
                           key={i}
                           style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', opacity: rem.isCompleted ? 0.5 : 1 }}
                           onPress={() => handleToggleReminder(rem)}
                           onLongPress={() => handleDeleteReminder(rem.reminderId)}
                        >
                           <View style={{ width: 60, height: 60, backgroundColor: rem.isCompleted ? '#E5E7EB' : '#FEE2E2', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                              <Text style={{ fontSize: 10, color: rem.isCompleted ? '#6B7280' : '#EF4444', fontWeight: 'bold' }}>{new Date(rem.reminderDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
                              <Text style={{ fontSize: 18, color: rem.isCompleted ? '#4B5563' : '#B91C1C', fontWeight: '900' }}>{new Date(rem.reminderDate).getDate()}</Text>
                              <Text style={{ fontSize: 10, color: rem.isCompleted ? '#6B7280' : '#EF4444', fontWeight: 'bold' }}>{new Date(rem.reminderDate).toLocaleDateString('tr-TR', { month: 'short' })}</Text>
                           </View>
                           <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: '700', color: rem.isCompleted ? '#6B7280' : '#1F2937', textDecorationLine: rem.isCompleted ? 'line-through' : 'none' }}>{rem.reminderTitle}</Text>
                              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{rem.isCompleted ? 'Tamamlandı' : 'Bekliyor'}</Text>
                           </View>
                           <TouchableOpacity onPress={() => handleToggleReminder(rem)} style={{ padding: 10 }}>
                              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: rem.isCompleted ? '#10B981' : '#D1D5DB', backgroundColor: rem.isCompleted ? '#10B981' : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                                 {rem.isCompleted && <Sparkles size={14} color="#FFF" />}
                              </View>
                           </TouchableOpacity>
                        </TouchableOpacity>
                     ))
                  )}
               </View>

               {/* Buzagilari */}
               <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                     <ChevronLeft size={20} color="#1d1d1f" style={{ transform: [{ rotate: '-90deg' }] }} />
                     <Text style={styles.sectionTitle}>Buzagilari</Text>
                     <TouchableOpacity
                        style={styles.addCircle}
                        onPress={() => setAddCalfModalVisible(true)}
                     >
                        <Plus size={16} color="#FFF" />
                     </TouchableOpacity>
                  </View>
                  {offspring.length > 0 ? offspring.map((kid, i) => (
                     <TouchableOpacity
                        key={i}
                        style={styles.offspringRow}
                        onPress={() => navigation.push('AnimalDetail', { animalId: kid.animalId })}
                     >
                        <View style={styles.offspringAvatar}>
                           <Text style={styles.offspringLetter}>{kid.name?.[0]}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                           <Text style={styles.offspringName}>{kid.name}</Text>
                           <Text style={styles.offspringTag}>{kid.tagNumber} - {kid.type}</Text>
                        </View>
                        <ChevronRight size={20} color="#CBD5E1" />
                     </TouchableOpacity>
                  )) : (
                     <Text style={styles.emptyText}>Buzagisi bulunamadi, + butonu ile ekleyiniz</Text>
                  )}
               </View>
            </View>
         </ScrollView>

         {/* DUZENLEME MODALI */}
         <Modal visible={isEditModalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
               <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Bilgileri Guncelle</Text>
                     <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                        <X size={24} color="#6B7280" />
                     </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                     <Text style={styles.inputLabel}>Isim</Text>
                     <TextInput style={[styles.input, { marginBottom: 10 }]} value={editForm.name} onChangeText={t => setEditForm({ ...editForm, name: t })} placeholder="Isim" />

                     <Text style={styles.inputLabel}>Kupe No</Text>
                     <TextInput style={[styles.input, { marginBottom: 14 }]} value={editForm.tagNumber} onChangeText={t => setEditForm({ ...editForm, tagNumber: t.toUpperCase() })} placeholder="Kupe No" />

                     <Text style={styles.inputLabel}>Irk</Text>
                     <TextInput style={[styles.input, { marginBottom: 10 }]} value={editForm.breed} onChangeText={t => setEditForm({ ...editForm, breed: t })} placeholder="Irk" />

                     <Text style={styles.inputLabel}>Dogum Tarihi</Text>
                     <TouchableOpacity
                        style={[styles.input, { marginBottom: 14, justifyContent: 'center' }]}
                        onPress={() => setShowEditDatePicker(true)}
                     >
                        <Text style={{ fontWeight: '600', color: editForm.birthDate ? '#1d1d1f' : '#9CA3AF' }}>
                           {editForm.birthDate ? new Date(editForm.birthDate).toLocaleDateString('tr-TR') : 'Seçiniz'}
                        </Text>
                     </TouchableOpacity>

                     {showEditDatePicker && (
                        <DateTimePicker
                           value={editForm.birthDate ? new Date(editForm.birthDate) : new Date()}
                           mode="date"
                           display="default"
                           onChange={(event, selectedDate) => {
                              setShowEditDatePicker(false);
                              if (selectedDate) {
                                 const dt = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
                                 setEditForm({ ...editForm, birthDate: dt.toISOString().split('T')[0] });
                              }
                           }}
                        />
                     )}

                     <Text style={styles.inputLabel}>Cinsiyet</Text>
                     <View style={styles.chipRow}>
                        {['Dişi', 'Erkek'].map(g => (
                           <TouchableOpacity key={g} onPress={() => setEditForm({ ...editForm, gender: g })} style={[styles.chip, editForm.gender === g && styles.chipActive]}>
                              <Text style={[styles.chipText, editForm.gender === g && styles.chipTextActive]}>{g}</Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <Text style={styles.inputLabel}>Tur</Text>
                     <View style={styles.chipRow}>
                        {['İnek', 'Düve', 'Tosun', 'Dana', 'Buzağı'].map(t => (
                           <TouchableOpacity key={t} onPress={() => setEditForm({ ...editForm, type: t })} style={[styles.chip, editForm.type === t && styles.chipActive]}>
                              <Text style={[styles.chipText, editForm.type === t && styles.chipTextActive]}>{t}</Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <Text style={styles.inputLabel}>Gebelik Durumu</Text>
                     <View style={styles.chipRow}>
                        {['Gebe', 'Boş', 'Kuruda'].map(s => (
                           <TouchableOpacity key={s} onPress={() => setEditForm({ ...editForm, pregnancyStatus: s })} style={[styles.chip, editForm.pregnancyStatus === s && styles.chipActive]}>
                              <Text style={[styles.chipText, editForm.pregnancyStatus === s && styles.chipTextActive]}>{s}</Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <Text style={styles.inputLabel}>Saglik Durumu</Text>
                     <View style={styles.chipRow}>
                        {['Sağlıklı', 'Hasta', 'Tedavide'].map(s => (
                           <TouchableOpacity key={s} onPress={() => setEditForm({ ...editForm, healthStatus: s })} style={[styles.chip, editForm.healthStatus === s && styles.chipActive]}>
                              <Text style={[styles.chipText, editForm.healthStatus === s && styles.chipTextActive]}>{s}</Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <Text style={styles.inputLabel}>Sut Durumu</Text>
                     <View style={styles.chipRow}>
                        {['Sağmal', 'Kuru', 'Yok'].map(s => (
                           <TouchableOpacity key={s} onPress={() => setEditForm({ ...editForm, milkStatus: s })} style={[styles.chip, editForm.milkStatus === s && styles.chipActive]}>
                              <Text style={[styles.chipText, editForm.milkStatus === s && styles.chipTextActive]}>{s}</Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <Text style={styles.inputLabel}>Anne Kupe No</Text>
                     <TextInput style={[styles.input, { marginBottom: 10 }]} value={editForm.motherTag} onChangeText={t => setEditForm({ ...editForm, motherTag: t.toUpperCase() })} placeholder="Anne kupe no" />

                     <Text style={styles.inputLabel}>Baba Kupe No</Text>
                     <TextInput style={[styles.input, { marginBottom: 14 }]} value={editForm.fatherTag} onChangeText={t => setEditForm({ ...editForm, fatherTag: t.toUpperCase() })} placeholder="Baba kupe no" />

                     <Text style={styles.inputLabel}>Notlar</Text>
                     <TextInput
                        style={[styles.input, { height: 90, textAlignVertical: 'top', marginBottom: 20 }]}
                        value={editForm.notes}
                        onChangeText={t => setEditForm({ ...editForm, notes: t })}
                        multiline
                        placeholder="Sigorta, ozel notlar..."
                     />

                     <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>GUNCELLE</Text>}
                     </TouchableOpacity>
                     <View style={{ height: 40 }} />
                  </ScrollView>
               </View>
            </View>
         </Modal>
         {/* OLAY EKLEME MODALI */}
         <Modal visible={isEventModalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
               <View style={[styles.modalContent, { height: '80%', padding: 20 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                     <TouchableOpacity onPress={() => { setEventModalVisible(false); setEditEventId(null); }}>
                        <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>Kapat</Text>
                     </TouchableOpacity>
                     <Text style={{ fontSize: 18, fontWeight: '800', color: '#1F2937' }}>Durum {editEventId ? 'Güncelle' : 'Ekle'}</Text>
                     <TouchableOpacity onPress={handleAddEvent} disabled={isSavingEvent}>
                        {isSavingEvent ? <ActivityIndicator size="small" color="#10B981" /> : <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '600' }}>Kaydet</Text>}
                     </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                     <TouchableOpacity
                        style={[styles.input, { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingVertical: 14 }]}
                        onPress={() => setShowEventDropdown(!showEventDropdown)}
                     >
                        <View style={{ marginRight: 10 }}>
                           {EVENT_TYPES.find(e => e.label === eventForm.title)?.icon || <Activity size={24} color="#4B5563" />}
                        </View>
                        <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '700', flex: 1 }}>
                           {eventForm.title || 'Durum Seçin'}
                        </Text>
                     </TouchableOpacity>

                     {showEventDropdown && (
                        <View style={styles.dropdownContainer}>
                           {EVENT_TYPES.map((item, idx) => (
                              <TouchableOpacity
                                 key={idx}
                                 style={[styles.dropdownItem, { flexDirection: 'row', alignItems: 'center' }]}
                                 onPress={() => {
                                    setEventForm({ ...eventForm, title: item.label });
                                    setShowEventDropdown(false);
                                 }}
                              >
                                 {item.icon}
                                 <Text style={[styles.dropdownText, { marginLeft: 10 }]}>{item.label}</Text>
                              </TouchableOpacity>
                           ))}
                           <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => {
                                 setEventForm({ ...eventForm, title: '' }); // clears it for custom input
                                 setShowEventDropdown(false);
                              }}
                           >
                              <Text style={[styles.dropdownText, { color: '#3B82F6' }]}>+ Yeni Olay (Kendin Yaz)</Text>
                           </TouchableOpacity>
                        </View>
                     )}

                     {!EVENT_TYPES.find(e => e.label === eventForm.title) && eventForm.title !== '' && (
                        <TextInput
                           style={[styles.input, { marginBottom: 16 }]}
                           value={eventForm.title}
                           onChangeText={t => setEventForm({ ...eventForm, title: t })}
                           placeholder="Olay Türü (Kendiniz yazın)"
                        />
                     )}

                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 }}>
                        <Text style={{ color: '#6B7280', fontSize: 15 }}>Durum Tarihi</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                           <TouchableOpacity
                              style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
                              onPress={() => { setEventDatePickerMode('date'); setShowEventDatePicker(true); }}
                           >
                              <Text style={{ fontWeight: '700', color: '#1F2937' }}>
                                 {eventForm.date.toLocaleDateString('tr-TR')}
                              </Text>
                           </TouchableOpacity>
                           <TouchableOpacity
                              style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
                              onPress={() => { setEventDatePickerMode('time'); setShowEventDatePicker(true); }}
                           >
                              <Text style={{ fontWeight: '700', color: '#1F2937' }}>
                                 {`${eventForm.time.getHours().toString().padStart(2, '0')}:${eventForm.time.getMinutes().toString().padStart(2, '0')}`}
                              </Text>
                           </TouchableOpacity>
                        </View>
                     </View>

                     {showEventDatePicker && (
                        <DateTimePicker
                           value={eventDatePickerMode === 'time' ? eventForm.time : eventForm.date}
                           mode={eventDatePickerMode}
                           display="default"
                           is24Hour={true}
                           onChange={(event, selectedDate) => {
                              setShowEventDatePicker(false);
                              if (event.type === 'set' && selectedDate) {
                                 if (eventDatePickerMode === 'time') {
                                    setEventForm({ ...eventForm, time: selectedDate });
                                 } else {
                                    setEventForm({ ...eventForm, date: selectedDate });
                                 }
                              }
                           }}
                        />
                     )}

                     {eventForm.title === 'Doğum Yaptı' && (
                        <View style={{ marginBottom: 16 }}>
                           <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                              Doğum güçlük seviyesini, canlı doğum değilse ölü doğum seçeneğini seçiniz.
                           </Text>
                           <View style={{ flexDirection: 'row', gap: 10 }}>
                              {['Normal', 'Zor', 'Ölü'].map(opt => (
                                 <TouchableOpacity
                                    key={opt}
                                    style={[{ flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, alignItems: 'center' }, eventForm.difficulty === opt && { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]}
                                    onPress={() => setEventForm({ ...eventForm, difficulty: opt })}
                                 >
                                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: eventForm.difficulty === opt ? '#10B981' : '#E5E7EB', marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
                                       {eventForm.difficulty === opt && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981' }} />}
                                    </View>
                                    <Text style={[{ color: '#4B5563', fontWeight: '600' }, eventForm.difficulty === opt && { color: '#10B981' }]}>{opt}</Text>
                                 </TouchableOpacity>
                              ))}
                           </View>
                        </View>
                     )}

                     {eventForm.title === 'Gebelik Testi' && (
                        <View style={{ marginBottom: 16, backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#DBEAFE' }}>
                           <Text style={{ color: '#1D4ED8', fontSize: 13, marginBottom: 12, fontWeight: '600' }}>
                              Test sonucunu seçin. Hayvanın gebelik durumu otomatik güncellenecektir.
                           </Text>
                           <View style={{ flexDirection: 'row', gap: 10 }}>
                              {['Pozitif', 'Negatif'].map(opt => (
                                 <TouchableOpacity
                                    key={opt}
                                    style={[{ flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 12, alignItems: 'center', backgroundColor: '#FFF' }, eventForm.pregnancyTestResult === opt && { borderColor: '#3B82F6', backgroundColor: '#DBEAFE' }]}
                                    onPress={() => setEventForm({ ...eventForm, pregnancyTestResult: opt })}
                                 >
                                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: eventForm.pregnancyTestResult === opt ? '#3B82F6' : '#BFDBFE', marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
                                       {eventForm.pregnancyTestResult === opt && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6' }} />}
                                    </View>
                                    <Text style={[{ color: '#60A5FA', fontWeight: '600' }, eventForm.pregnancyTestResult === opt && { color: '#2563EB' }]}>{opt}</Text>
                                 </TouchableOpacity>
                              ))}
                           </View>
                        </View>
                     )}

                     {eventForm.title === 'Tohumlama Yapıldı' && (
                        <View style={{ marginBottom: 16 }}>
                           <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                              Tohumlama yöntemini seçiniz ve boğa numarasını giriniz.
                           </Text>
                           <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                              {['Suni Tohum', 'Tabii Tohum'].map(opt => (
                                 <TouchableOpacity
                                    key={opt}
                                    style={[{ flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, alignItems: 'center' }, eventForm.inseminationType === opt && { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }]}
                                    onPress={() => setEventForm({ ...eventForm, inseminationType: opt })}
                                 >
                                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: eventForm.inseminationType === opt ? '#3B82F6' : '#E5E7EB', marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
                                       {eventForm.inseminationType === opt && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6' }} />}
                                    </View>
                                    <Text style={[{ color: '#4B5563', fontWeight: '600' }, eventForm.inseminationType === opt && { color: '#3B82F6' }]}>{opt}</Text>
                                 </TouchableOpacity>
                              ))}
                           </View>

                           <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 4, marginLeft: 4 }}>Kullanılan Boğa (Adı / Küpe No)</Text>
                           <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TextInput
                                 style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                 placeholder="Boğa Adı veya Küpe Numarası..."
                                 value={eventForm.bullName}
                                 onChangeText={t => setEventForm({ ...eventForm, bullName: t })}
                              />
                           </View>
                        </View>
                     )}

                     <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Notlar"
                        value={eventForm.description}
                        onChangeText={t => setEventForm({ ...eventForm, description: t })}
                        multiline
                     />
                     <Text style={{ textAlign: 'right', color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{eventForm.description.length}/240</Text>

                     <View style={{ height: 30 }} />
                  </ScrollView>
               </View>
            </View>
         </Modal>

         {/* BUZAGI EKLE MODALI */}
         <Modal visible={isAddCalfModalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
               <View style={styles.modalContent}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                     <TouchableOpacity onPress={() => setAddCalfModalVisible(false)} style={{ padding: 5 }}>
                        <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>Kapat</Text>
                     </TouchableOpacity>
                     <Text style={{ fontSize: 20, fontWeight: '800', color: '#374151' }}>Hayvan Ekle</Text>
                     <TouchableOpacity onPress={handleSaveCalf} disabled={savingCalf} style={{ padding: 5 }}>
                        {savingCalf ? <ActivityIndicator size="small" color="#10B981" /> : <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '600' }}>Kaydet</Text>}
                     </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                     <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="İsim / Kayış nu" value={calfForm.name} onChangeText={t => setCalfForm({ ...calfForm, name: t })} />
                     <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Küpe Nu (örn: TR...)" value={calfForm.tagNumber} onChangeText={t => setCalfForm({ ...calfForm, tagNumber: t.toUpperCase() })} />

                     <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 12 }}>
                        <TouchableOpacity
                           style={{ flex: 1, paddingVertical: 12, backgroundColor: calfForm.gender === 'Dişi' ? '#FFF' : '#E5E7EB', alignItems: 'center' }}
                           onPress={() => setCalfForm({ ...calfForm, gender: 'Dişi' })}
                        >
                           <Text style={{ fontWeight: calfForm.gender === 'Dişi' ? '800' : '500', color: '#1d1d1f' }}>Dişi</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                           style={{ flex: 1, paddingVertical: 12, backgroundColor: calfForm.gender === 'Erkek' ? '#FFF' : '#E5E7EB', alignItems: 'center' }}
                           onPress={() => setCalfForm({ ...calfForm, gender: 'Erkek' })}
                        >
                           <Text style={{ fontWeight: calfForm.gender === 'Erkek' ? '800' : '500', color: '#1d1d1f' }}>Erkek</Text>
                        </TouchableOpacity>
                     </View>

                     <View style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }]}>
                        <Text style={{ color: '#6B7280', fontSize: 15 }}>Doğum Tarihi:</Text>
                        <TouchableOpacity
                           style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                           onPress={() => setShowCalfDatePicker(true)}
                        >
                           <Text style={{ fontWeight: '600', color: calfForm.birthDate ? '#1d1d1f' : '#9CA3AF' }}>
                              {calfForm.birthDate ? new Date(calfForm.birthDate).toLocaleDateString('tr-TR') : 'Seçiniz'}
                           </Text>
                        </TouchableOpacity>
                     </View>

                     {showCalfDatePicker && (
                        <DateTimePicker
                           value={calfForm.birthDate ? new Date(calfForm.birthDate) : new Date()}
                           mode="date"
                           display="default"
                           onChange={(event, selectedDate) => {
                              setShowCalfDatePicker(false);
                              if (selectedDate) {
                                 const dt = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
                                 setCalfForm({ ...calfForm, birthDate: dt.toISOString().split('T')[0] });
                              }
                           }}
                        />
                     )}

                     <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Irkı" value={calfForm.breed} onChangeText={t => setCalfForm({ ...calfForm, breed: t })} />

                     <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 4, marginLeft: 4 }}>Anne Küpe</Text>
                     <TextInput style={[styles.input, { marginBottom: 12, backgroundColor: '#F9FAFB', color: '#374151', fontWeight: 'bold' }]} value={animal?.tagNumber} editable={false} />

                     <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 4, marginLeft: 4 }}>Baba adı, küpe</Text>
                     <TextInput style={[styles.input, { marginBottom: 12 }]} placeholder="Baba adı, küpe" value={calfForm.fatherTag} onChangeText={t => setCalfForm({ ...calfForm, fatherTag: t.toUpperCase() })} />

                     <TextInput style={[styles.input, { marginBottom: 30, minHeight: 80, textAlignVertical: 'top' }]} placeholder="Notlar" value={calfForm.notes} onChangeText={t => setCalfForm({ ...calfForm, notes: t })} multiline />
                  </ScrollView>
               </View>
            </View>
         </Modal>

         {/* BİLDİRİM EKLEME MODALI */}
         <Modal visible={isReminderModalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
               <View style={[styles.modalContent, { height: '50%' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                     <TouchableOpacity onPress={() => setReminderModalVisible(false)}>
                        <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>İptal</Text>
                     </TouchableOpacity>
                     <Text style={{ fontSize: 18, fontWeight: '800', color: '#1F2937' }}>Bildirim Ekle</Text>
                     <TouchableOpacity onPress={handleAddReminder} disabled={isSavingReminder}>
                        {isSavingReminder ? <ActivityIndicator size="small" color="#10B981" /> : <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '600' }}>Kaydet</Text>}
                     </TouchableOpacity>
                  </View>

                  <TextInput
                     style={[styles.input, { marginBottom: 16 }]}
                     placeholder="Bildirim Başlığı / Notu"
                     value={reminderForm.title}
                     onChangeText={t => setReminderForm({ ...reminderForm, title: t })}
                  />

                  <View style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }]}>
                     <Text style={{ color: '#6B7280', fontSize: 15 }}>Hatırlatma Tarihi:</Text>
                     <TouchableOpacity
                        style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
                        onPress={() => setShowReminderDatePicker(true)}
                     >
                        <Text style={{ fontWeight: '700', color: '#1F2937' }}>{reminderForm.date.toLocaleDateString('tr-TR')}</Text>
                     </TouchableOpacity>
                  </View>

                  {showReminderDatePicker && (
                     <DateTimePicker
                        value={reminderForm.date}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                           setShowReminderDatePicker(false);
                           if (selectedDate) {
                              setReminderForm({ ...reminderForm, date: selectedDate });
                           }
                        }}
                     />
                  )}
               </View>
            </View>
         </Modal>
      </SafeAreaView>
   );
}

function InfoItem({ label, value, color, isLast }) {
   return (
      <View style={[styles.infoItem, isLast && { borderBottomWidth: 0 }]}>
         <Text style={styles.infoLabel}>{label}</Text>
         <Text style={[styles.infoValue, { color: color }]}>{value || '-'}</Text>
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#F3F4F6' },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#10B981' },
   backButton: { padding: 8 },
   headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
   editButton: { padding: 8 },
   imageSection: { height: 220, backgroundColor: '#FFF', paddingVertical: 10 },
   imageCard: { width: width * 0.4, height: 180, borderRadius: 12, marginLeft: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
   mainImage: { width: '100%', height: '100%' },
   placeholderImage: { width: '100%', height: '100%', backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
   placeholderText: { fontSize: 40, fontWeight: '900', color: '#CBD5E1' },
   addImageCard: { backgroundColor: '#FFF', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
   addImageText: { color: '#94A3B8', fontWeight: '800', marginTop: 8 },
   topBadge: { position: 'absolute', top: 15, left: 155, backgroundColor: '#FFF', borderRadius: 20, padding: 4, elevation: 5 },
   content: { padding: 16 },
   statusCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 20, elevation: 2 },
   statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#94A3B8', borderRadius: 12, padding: 8, marginBottom: 12 },
   statusTitle: { color: '#FFF', fontWeight: '900', fontSize: 16, marginLeft: 8 },
   statusArrow: { backgroundColor: '#10B981', borderRadius: 20, padding: 4 },
   statusRow: { flexDirection: 'row', padding: 10 },
   pregIconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFE4E6', justifyContent: 'center', alignItems: 'center' },
   pregLabel: { fontSize: 15, fontWeight: '800', color: '#1d1d1f' },
   pregSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
   warningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginTop: 15 },
   warningText: { flex: 1, marginLeft: 10, color: '#92400E', fontWeight: '800', fontSize: 16 },
   section: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 20, elevation: 1 },
   sectionHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 8, marginBottom: 16 },
   sectionTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#1d1d1f', marginLeft: 8 },
   editCircle: { backgroundColor: '#10B981', borderRadius: 20, padding: 8 },
   addCircle: { backgroundColor: '#10B981', borderRadius: 20, padding: 8 },
   infoGrid: { paddingHorizontal: 4 },
   infoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
   infoLabel: { fontSize: 15, color: '#64748B', fontWeight: '600' },
   infoValue: { fontSize: 15, fontWeight: '800' },
   eventRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 15 },
   eventTitle: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '800', color: '#1d1d1f' },
   eventDateBox: { alignItems: 'center', width: 60 },
   eventTime: { fontSize: 10, color: '#94A3B8' },
   eventDay: { fontSize: 18, fontWeight: '900', color: '#1d1d1f' },
   eventMonthBox: { backgroundColor: '#EF4444', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
   eventMonth: { color: '#FFF', fontSize: 10, fontWeight: '900' },
   offspringRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
   offspringAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
   offspringLetter: { fontSize: 18, fontWeight: '900', color: '#64748B' },
   offspringName: { fontSize: 15, fontWeight: '800', color: '#1d1d1f' },
   offspringTag: { fontSize: 12, color: '#64748B', marginTop: 2 },
   emptyText: { color: '#94A3B8', textAlign: 'center', paddingVertical: 10 },
   modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
   modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, height: '93%' },
   modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
   modalTitle: { fontSize: 20, fontWeight: '900' },
   inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
   input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 15, fontSize: 15, fontWeight: '700', color: '#1d1d1f' },
   chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
   chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
   chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
   chipText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
   chipTextActive: { color: '#FFF' },
   saveBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 15, alignItems: 'center' },
   saveBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
   dropdownContainer: {
      backgroundColor: '#1C1C1E',
      borderRadius: 12,
      padding: 8,
      marginBottom: 14,
      marginTop: -10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
   },
   dropdownItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
   },
   dropdownText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600'
   }
});
