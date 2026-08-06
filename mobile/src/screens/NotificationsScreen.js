import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Image
} from 'react-native';
import { Bell, CheckCircle, Calendar, ChevronRight, Plus, X } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Notification Modal State
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      const response = await api.get(user?.userId ? `/Reminders?userId=${user.userId}` : '/Reminders');
      const activeReminders = response.data.filter(r => !r.isCompleted);
      setReminders(activeReminders);
    } catch (error) {
      console.error('Bildirimler cekilemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReminders();
  };

  const markAsCompleted = async (id) => {
    try {
      setReminders(prev => prev.filter(r => r.reminderId !== id));
      const reminderToUpdate = reminders.find(r => r.reminderId === id);
      await api.put(`/Reminders/${id}`, {
        ...reminderToUpdate,
        isCompleted: true
      });
    } catch (error) {
      console.error('Hatirlatici guncellenemedi', error);
      fetchReminders();
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api.post('/Reminders', {
        userId: user?.userId || 1,
        reminderTitle: form.title,
        reminderDate: form.date,
        isCompleted: false
      });
      setShowModal(false);
      setForm({ title: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchReminders();
    } catch (error) {
      console.error('Bildirim kaydedilemedi:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
      >
        <View style={styles.filterRow}>
           <Text style={styles.headerTitle}>Bildirimler / Görevler</Text>
        </View>

        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Bekleyen bildiriminiz bulunmuyor.</Text>
          </View>
        ) : (
          reminders.map((reminder) => {
            const dateObj = new Date(reminder.reminderDate);
            const isOverdue = dateObj < new Date(new Date().setDate(new Date().getDate() - 1));
            const isToday = dateObj.toDateString() === new Date().toDateString();
            
            let dateColor = '#4B5563'; // gray
            let dateBg = '#F3F4F6';
            if (isOverdue) { dateColor = '#FFF'; dateBg = '#EF4444'; }
            else if (isToday) { dateColor = '#FFF'; dateBg = '#F59E0B'; }

            const day = dateObj.getDate();
            const month = dateObj.toLocaleDateString('tr-TR', { month: 'short' });

            return (
              <View key={reminder.reminderId} style={styles.card}>
                {/* Sol tarafta görsel yerine ikon tutucu */}
                <View style={styles.imagePlaceholder}>
                  <Bell size={24} color="#9CA3AF" />
                </View>

                {/* Orta Bilgi Alanı */}
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, isOverdue && { color: '#EF4444' }, isToday && { color: '#F59E0B' }]}>
                    {reminder.reminderTitle}
                  </Text>
                  {reminder.animalName && (
                    <Text style={styles.cardSubtitle}>
                      {reminder.animalName}
                    </Text>
                  )}
                  {/* Açıklama alanı şu an API'de description yok ama title'da olabilir, göstermelik sabit text */}
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {reminder.reminderTitle} işlemi için planlanan zaman.
                  </Text>
                </View>

                {/* Sağ Tarih Kutusu */}
                <TouchableOpacity style={styles.dateBox} onPress={() => markAsCompleted(reminder.reminderId)}>
                  <View style={styles.dateBoxTop}>
                    <Text style={styles.dateDayText}>{day}</Text>
                  </View>
                  <View style={[styles.dateBoxBottom, { backgroundColor: dateBg }]}>
                    <Text style={[styles.dateMonthText, (isOverdue || isToday) && { color: '#FFF' }]}>{month}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus size={30} color="#FFF" />
      </TouchableOpacity>

      {/* Ekleme Modalı */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ padding: 5 }}>
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>Kapat</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1F2937' }}>Bildirim / Görev Ekle</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{ padding: 5 }}>
                {saving ? <ActivityIndicator size="small" color="#10B981" /> : <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '600' }}>Kaydet</Text>}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={{ color: '#6B7280', fontSize: 15 }}>Bildirim Tarihi</Text>
              <TouchableOpacity 
                style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ fontWeight: '700', color: '#1d1d1f' }}>
                  {new Date(form.date).toLocaleDateString('tr-TR')}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={new Date(form.date)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    const dt = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
                    setForm({ ...form, date: dt.toISOString().split('T')[0] });
                  }
                }}
              />
            )}

            <View style={styles.inputGroup}>
              <TextInput 
                style={styles.input} 
                placeholder="Başlık" 
                value={form.title} 
                onChangeText={t => setForm({ ...form, title: t })} 
              />
            </View>
            
            <View style={styles.inputGroup}>
              <TextInput 
                style={styles.input} 
                placeholder="Açıklama" 
                value={form.description} 
                onChangeText={t => setForm({ ...form, description: t })} 
              />
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E7EB' },
  content: { padding: 12, paddingBottom: 100 },
  filterRow: { marginBottom: 12, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginVertical: 10 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 16, fontWeight: '600' },
  
  card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12, flexDirection: 'row', padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' },
  imagePlaceholder: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, marginLeft: 12, paddingRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#4B5563', marginBottom: 2 },
  cardSubtitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#6B7280' },
  
  dateBox: { width: 50, height: 50, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', backgroundColor: '#FFF' },
  dateBoxTop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateDayText: { fontSize: 14, fontWeight: '800', color: '#374151' },
  dateBoxBottom: { height: 20, justifyContent: 'center', alignItems: 'center' },
  dateMonthText: { fontSize: 10, fontWeight: '700', color: '#6B7280' },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, backgroundColor: '#34D399', borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  inputGroup: { marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, fontSize: 15, fontWeight: '600', color: '#1d1d1f', borderWidth: 1, borderColor: '#E5E7EB' }
});
