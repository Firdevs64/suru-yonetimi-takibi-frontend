import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { Search, Plus, ChevronRight, Inbox, X, Save, Camera, Edit3, Trash2, Heart, Scan, Tag, Baby, Droplet } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Tümü', 'Aktif', 'Gebe', 'Boş', 'Sağmal', 'Kuruda', 'Hasta', 'İnek', 'Düve', 'Tosun', 'Dana', 'Buzağı'];
const TYPE_OPTIONS = ['İnek', 'Düve', 'Tosun', 'Dana', 'Buzağı'];

export default function AnimalListScreen({ route, navigation }) {
  const { user } = useAuth();
  const targetUserId = route?.params?.userId || user?.userId;

  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [animalImages, setAnimalImages] = useState({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tagNumber: '', name: '', breed: '', gender: 'Dişi',
    pregnancyStatus: 'Boş', healthStatus: 'Sağlıklı',
    age: '', type: 'İnek', motherTag: '', fatherTag: ''
  });

  const fetchAnimals = useCallback(async () => {
    try {
      if (loading) setLoading(true);
      const response = await api.get(targetUserId ? `/Animals?userId=${targetUserId}` : '/Animals');
      const data = response.data;
      setAnimals(data);

      // Fotoğrafları yükle
      const images = {};
      const baseUrl = api.defaults.baseURL.replace('/api', '');
      for (const a of data) {
        images[a.animalId] = `${baseUrl}/images/animals/${a.animalId}.jpg?t=${new Date().getTime()}`;
      }
      setAnimalImages(images);

    } catch (error) {
      console.error('Hayvanlar çekilemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAnimals();

      // Dashboard'dan gelen filtre parametresini uygula
      if (route.params?.filter) {
        setSelectedCategory(route.params.filter);
        navigation.setParams({ filter: undefined });
      }

      // Detay sayfasından gelen prefill parametrelerini kontrol et
      if (route.params?.showAdd) {
        setModalMode('add');
        setForm({
          ...form,
          motherTag: route.params.prefillMother || '',
          type: 'Buzağı'
        });
        setShowModal(true);
        // Parametreleri temizle (tekrar açılmasın)
        navigation.setParams({ showAdd: undefined, prefillMother: undefined });
      }
    });
    return unsubscribe;
  }, [navigation, fetchAnimals, route.params]);

  // Barkod tarama sonrası tetiklenecek
  useEffect(() => {
    if (route.params?.scannedTag) {
      setSearchQuery(route.params.scannedTag);
      navigation.setParams({ scannedTag: undefined });
      
      // Eğer tek bir sonuç varsa direkt detaya gidebiliriz
      const found = animals.find(a => a.tagNumber === route.params.scannedTag);
      if (found) {
        navigation.navigate('AnimalDetail', { animalId: found.animalId });
      }
    }
  }, [route.params?.scannedTag, animals]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnimals();
  };

  const handleOpenEdit = (animal) => {
    setModalMode('edit');
    setEditingId(animal.animalId);
    setForm({
      tagNumber: animal.tagNumber,
      name: animal.name,
      breed: animal.breed || '',
      gender: animal.gender || 'Dişi',
      pregnancyStatus: animal.pregnancyStatus || 'Boş',
      healthStatus: animal.healthStatus || 'Sağlıklı',
      age: animal.age?.toString() || '',
      type: animal.type || 'İnek',
      motherTag: animal.motherTag || '',
      fatherTag: animal.fatherTag || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.tagNumber || !form.name) {
      Alert.alert('Uyarı', 'Küpe no ve isim alanları zorunludur.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        userId: targetUserId,
        age: form.age ? parseInt(form.age) : null,
        isActive: true
      };

      if (modalMode === 'add') {
        await api.post('/Animals', payload);
        Alert.alert('Başarılı', 'Hayvan eklendi.');
      } else {
        await api.put(`/Animals/${editingId}`, payload);
        Alert.alert('Başarılı', 'Hayvan güncellendi.');
      }

      setShowModal(false);
      fetchAnimals();
    } catch (error) {
      Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (animal) => {
    Alert.alert('Sil', `"${animal.name}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/Animals/${animal.animalId}`);
            fetchAnimals();
          } catch (e) { Alert.alert('Hata', 'Silinemedi.'); }
        }
      }
    ]);
  };

  const filteredAnimals = animals.filter(animal => {
    const searchLow = searchQuery.toLowerCase();
    const nameMatch = animal.name ? animal.name.toLowerCase().includes(searchLow) : false;
    const tagMatch = animal.tagNumber ? animal.tagNumber.toLowerCase().includes(searchLow) : false;
    const matchesSearch = searchQuery === '' ? true : (nameMatch || tagMatch);

    if (selectedCategory === 'Tümü') return matchesSearch;
    
    const pStatus = animal.pregnancyStatus || '';
    const hStatus = animal.healthStatus || '';
    const mStatus = animal.milkStatus || '';
    const aType = animal.type || '';

    if (selectedCategory === 'Gebe') return matchesSearch && pStatus === 'Gebe';
    if (selectedCategory === 'Hasta') return matchesSearch && hStatus === 'Hasta';
    if (selectedCategory === 'Boş') return matchesSearch && (pStatus === 'Boş' || pStatus === 'Bos');
    if (selectedCategory === 'Sağmal') return matchesSearch && (mStatus === 'Sağmal' || mStatus === 'Sagmal');
    if (selectedCategory === 'Kuruda') return matchesSearch && (pStatus === 'Kuruda' || mStatus === 'Kuruda');
    if (selectedCategory === 'Aktif') return matchesSearch && hStatus !== 'Hasta';
    
    // Tür bazlı filtrelemeler
    if (selectedCategory === 'İnek') return matchesSearch && (aType === 'İnek' || aType === 'Inek');
    if (selectedCategory === 'Düve') return matchesSearch && (aType === 'Düve' || aType === 'Duve');
    if (selectedCategory === 'Buzağı') return matchesSearch && (aType === 'Buzağı' || aType === 'Buzagi');
    if (['Tosun', 'Dana'].includes(selectedCategory)) return matchesSearch && aType === selectedCategory;

    return matchesSearch;
  });

  const renderAnimalItem = ({ item }) => {
    // Dinamik Emoji
    let animalEmoji = '🐄';
    let emojiSize = 22;
    
    if (item.type === 'Tosun' || item.type === 'Dana') {
      animalEmoji = '🐂';
      emojiSize = 22;
    } else if (item.type === 'Buzağı' || item.type === 'Buzagi') {
      animalEmoji = '🍼🐮'; // Çok daha minnoş bir görünüm
      emojiSize = 15;
    }

    // Dinamik bilgi metni
    let infoText = item.notes || '';
    let infoColor = '#6B7280';
    if (item.pregnancyStatus === 'Gebe') {
      infoText = '(Gebe) Tahmini doğum bilgisini detaydan kontrol ediniz';
      infoColor = '#B45309'; // Turuncu ton
    } else if (item.pregnancyStatus === 'Doğum Yaptı') {
      infoText = 'Yakın zamanda doğum yaptı';
      infoColor = '#6B7280';
    } else if (!infoText && (item.type === 'Buzağı' || item.type === 'Buzagi')) {
      infoText = '40.gün itibarıyla İlk karma aşılarını uygulayabilirsiniz!';
      infoColor = '#B45309';
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AnimalDetail', { animalId: item.animalId })}
      >
        <View style={styles.imageBox}>
          {animalImages[item.animalId] ? (
            <Image source={{ uri: animalImages[item.animalId] }} style={styles.cardImage} />
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ position: 'relative', marginRight: 8, paddingRight: 4 }}>
                <Text style={{ fontSize: emojiSize }}>{animalEmoji}</Text>
                {item.gender && (
                  <View style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    backgroundColor: item.gender === 'Dişi' ? '#EF4444' : '#3B82F6',
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: '#FFF'
                  }}>
                    <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900' }}>
                      {item.gender === 'Dişi' ? 'D' : 'E'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.animalName} numberOfLines={1}>{item.name?.toUpperCase() || 'İSİMSİZ'}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 6 }}>
              <Tag size={12} color="#A1A1AA" style={{ marginRight: 6, transform: [{ rotate: '90deg' }] }} />
              <Text style={styles.animalTag}>{item.tagNumber}</Text>
            </View>

            {infoText ? (
              <Text style={{ fontSize: 12, fontWeight: '600', color: infoColor }} numberOfLines={2}>
                {infoText}
              </Text>
            ) : null}
          </View>

          {/* Sağ Taraftaki İkonlar */}
          <View style={styles.rightIconsColumn}>
            {item.pregnancyStatus === 'Gebe' && (
              <View style={[styles.rightIconBubble, { backgroundColor: '#CCFBF1' }]}>
                <Baby size={14} color="#0F766E" />
              </View>
            )}
            {item.milkStatus === 'Sağmal' && (
              <View style={[styles.rightIconBubble, { backgroundColor: '#F8FAFC' }]}>
                <Droplet size={14} color="#94A3B8" />
              </View>
            )}
            {item.healthStatus !== 'Hasta' && (
              <View style={[styles.rightIconBubble, { backgroundColor: '#3F3F46', marginTop: 'auto' }]}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>S</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={styles.scanBtn} 
            onPress={() => navigation.getParent()?.navigate('Scanner')}
          >
            <Scan size={22} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              style={[styles.categoryItem, selectedCategory === item && styles.categoryItemActive]}
            >
              <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : filteredAnimals.length === 0 ? (
        <View style={styles.center}>
          <Inbox size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAnimals}
          renderItem={renderAnimalItem}
          keyExtractor={item => item.animalId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {!route?.params?.userId && (
        <TouchableOpacity style={styles.fab} onPress={() => { setModalMode('add'); setForm({ tagNumber: '', name: '', breed: '', gender: 'Dişi', pregnancyStatus: 'Boş', healthStatus: 'Sağlıklı', age: '', type: 'İnek', motherTag: '', fatherTag: '' }); setShowModal(true); }}>
          <Plus size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ padding: 5 }}>
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>Kapat</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#374151' }}>{modalMode === 'add' ? 'Hayvan Ekle' : 'Güncelle'}</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{ padding: 5 }}>
                {saving ? <ActivityIndicator size="small" color="#10B981" /> : <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '600' }}>Kaydet</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput 
                style={[styles.input, { marginBottom: 12 }]} 
                placeholder="İsim / Kayış nu" 
                value={form.name} 
                onChangeText={t => setForm({ ...form, name: t })} 
              />
              <TextInput 
                style={[styles.input, { marginBottom: 12 }]} 
                placeholder="Küpe Nu (örn: TR...)" 
                value={form.tagNumber} 
                onChangeText={t => setForm({ ...form, tagNumber: t.toUpperCase() })} 
              />

              <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#D1D5DB', marginBottom: 12 }}>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: form.gender === 'Dişi' ? '#FFF' : '#E5E7EB', alignItems: 'center' }}
                  onPress={() => setForm({ ...form, gender: 'Dişi', type: 'İnek' })}
                >
                  <Text style={{ fontWeight: form.gender === 'Dişi' ? '800' : '500', color: '#1d1d1f' }}>Dişi</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: form.gender === 'Erkek' ? '#FFF' : '#E5E7EB', alignItems: 'center' }}
                  onPress={() => setForm({ ...form, gender: 'Erkek', type: 'Tosun' })}
                >
                  <Text style={{ fontWeight: form.gender === 'Erkek' ? '800' : '500', color: '#1d1d1f' }}>Erkek</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }]}>
                <Text style={{ color: '#6B7280', fontSize: 15 }}>Doğum Tarihi:</Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ fontWeight: '600', color: form.birthDate ? '#1d1d1f' : '#9CA3AF' }}>
                    {form.birthDate ? new Date(form.birthDate).toLocaleDateString('tr-TR') : 'Seçiniz'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={form.birthDate ? new Date(form.birthDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      // Offset the timezone properly to avoid selecting the day before
                      const dt = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
                      setForm({ ...form, birthDate: dt.toISOString().split('T')[0] });
                    }
                  }}
                />
              )}

              <TextInput 
                style={[styles.input, { marginBottom: 12 }]} 
                placeholder="Irkı" 
                value={form.breed} 
                onChangeText={t => setForm({ ...form, breed: t })} 
              />

              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Anne Küpe</Text>
                </View>
                <TextInput 
                  style={styles.input} 
                  placeholder="Anne Küpe No" 
                  value={form.motherTag} 
                  onChangeText={t => setForm({ ...form, motherTag: t.toUpperCase() })} 
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>Baba adı, küpe</Text>
                </View>
                <TextInput 
                  style={styles.input} 
                  placeholder="Baba adı, küpe" 
                  value={form.fatherTag} 
                  onChangeText={t => setForm({ ...form, fatherTag: t.toUpperCase() })} 
                />
              </View>

              <TextInput 
                style={[styles.input, { marginBottom: 40 }]} 
                placeholder="Notlar" 
                value={form.notes} 
                onChangeText={t => setForm({ ...form, notes: t })} 
                multiline
              />

            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 12, height: 52, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, fontWeight: '600' },
  scanBtn: { padding: 8, marginLeft: 4, backgroundColor: '#EFF6FF', borderRadius: 10 },
  categoryContainer: { paddingBottom: 8 },
  categoryItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginLeft: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  categoryItemActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  categoryText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  categoryTextActive: { color: '#FFF' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden', flexDirection: 'row', padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  imageBox: { width: 110, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  cardImage: { width: '100%', height: '100%' },
  placeholderBox: { width: '100%', height: '100%', backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 24, fontWeight: '900', color: '#A5B4FC' },
  statusBadge: { position: 'absolute', bottom: 0, width: '100%', paddingVertical: 2, alignItems: 'center' },
  statusText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  cardInfo: { flex: 1, marginLeft: 16, flexDirection: 'row' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  animalName: { fontSize: 17, fontWeight: '800', color: '#374151', flex: 1 },
  animalTag: { fontSize: 15, color: '#4B5563', fontWeight: '700' },
  rightIconsColumn: { width: 30, alignItems: 'center', gap: 6, paddingLeft: 8, justifyContent: 'center' },
  rightIconBubble: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 4 },
  miniActionBtn: { padding: 6, backgroundColor: '#F3F4F6', borderRadius: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F3F4F6', borderRadius: 8 },
  tagBadgeText: { fontSize: 10, fontWeight: '800', color: '#6B7280' },
  ageText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 12, color: '#9CA3AF', fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, backgroundColor: '#3B82F6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#3B82F6', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  closeBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, fontSize: 15, fontWeight: '700', color: '#1d1d1f', borderWidth: 1, borderColor: '#F3F4F6' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F3F4F6' },
  chipActive: { backgroundColor: '#3B82F6' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  chipTextActive: { color: '#FFF' },
  pedigreeBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginBottom: 20, gap: 10 },
  pedigreeTitle: { fontSize: 13, fontWeight: '800', color: '#1d1d1f', marginBottom: 4 },
  miniInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: '#E2E8F0' },
  saveBtnBox: { marginTop: 10 },
  saveBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
