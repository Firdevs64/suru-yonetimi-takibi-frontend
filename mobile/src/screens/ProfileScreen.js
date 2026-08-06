import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  Image,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Mail, Phone, LogOut, ChevronRight, ShieldCheck, BellRing, Camera, Lock, Stethoscope, Save, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/axios';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const isAdmin = user?.email === 'firdevs6452@gmail.com';
  
  const [profileImage, setProfileImage] = useState(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  
  // Modallar
  const [isPassModalVisible, setIsPassModalVisible] = useState(false);
  const [isVetModalVisible, setIsVetModalVisible] = useState(false);
  
  // Şifre State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Veteriner State
  const [vetName, setVetName] = useState(user?.vetName || '');
  const [vetPhone, setVetPhone] = useState(user?.vetPhone || '');
  const [vetLoading, setVetLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermelisiniz.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi.');
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }
    try {
      setPassLoading(true);
      await api.post('/Users/change-password', {
        userId: user.userId,
        oldPassword,
        newPassword
      });
      Alert.alert('Başarılı', 'Şifreniz güncellendi.');
      setIsPassModalVisible(false);
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.message || 'Şifre güncellenemedi.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleUpdateVet = async () => {
    try {
      setVetLoading(true);
      await api.put('/Users/profile', {
        userId: user.userId,
        phone: user.phone,
        vetName,
        vetPhone
      });
      Alert.alert('Başarılı', 'Veteriner bilgileriniz kaydedildi.');
      setIsVetModalVisible(false);
    } catch (error) {
      Alert.alert('Hata', 'Bilgiler güncellenemedi.');
    } finally {
      setVetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarBox, isAdmin && { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Camera size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.fullName}</Text>
          <Text style={[styles.userRole, isAdmin && { color: '#F59E0B' }]}>
            {isAdmin ? 'Sistem Yöneticisi' : 'Sürü Yöneticisi'}
          </Text>
        </View>

        {/* Kullanıcı Bilgileri Bölümü */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İletişim Bilgilerim</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Mail size={18} color="#6B7280" />
              <Text style={styles.infoText}>{user?.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Phone size={18} color="#6B7280" />
              <Text style={styles.infoText}>{user?.phone || 'Telefon eklenmemiş'}</Text>
            </View>
          </View>
        </View>

        {/* Veteriner Bölümü (Sadece Çiftçiler İçin) */}
        {!isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Veteriner Bilgilerim</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => setIsVetModalVisible(true)}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}><Stethoscope size={20} color="#10B981" /></View>
                <View>
                  <Text style={styles.menuItemText}>{vetName || 'Veteriner Ekle'}</Text>
                  <Text style={styles.menuSubText}>{vetPhone || 'Numara yok'}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar & Güvenlik</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setIsPassModalVisible(true)}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FFF7ED' }]}><ShieldCheck size={20} color="#F97316" /></View>
              <Text style={styles.menuItemText}>Şifre Değiştir</Text>
            </View>
            <ChevronRight size={20} color="#D1D5DB" />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#F0F9FF' }]}><BellRing size={20} color="#0EA5E9" /></View>
              <Text style={styles.menuItemText}>Anlık Bildirimler</Text>
            </View>
            <Switch value={isNotificationsEnabled} onValueChange={setIsNotificationsEnabled} />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={22} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Şifre Modal */}
      <Modal visible={isPassModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>
            <TextInput style={styles.modalInput} placeholder="Mevcut Şifre" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
            <TextInput style={styles.modalInput} placeholder="Yeni Şifre" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <TextInput style={styles.modalInput} placeholder="Yeni Şifre (Tekrar)" secureTextEntry value={newPasswordConfirm} onChangeText={setNewPasswordConfirm} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsPassModalVisible(false)}><Text>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
                {passLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Güncelle</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Veteriner Modal */}
      <Modal visible={isVetModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Stethoscope size={24} color="#10B981" />
              <Text style={styles.modalTitle}>Veteriner Bilgileri</Text>
            </View>
            <TextInput style={styles.modalInput} placeholder="Veteriner Adı Soyadı" value={vetName} onChangeText={setVetName} />
            <TextInput style={styles.modalInput} placeholder="Telefon Numarası" keyboardType="phone-pad" value={vetPhone} onChangeText={setVetPhone} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsVetModalVisible(false)}><Text>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#10B981' }]} onPress={handleUpdateVet}>
                {vetLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  avatarWrapper: { position: 'relative' },
  avatarBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { fontSize: 40, fontWeight: '900', color: '#FFF' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1d1d1f', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  userName: { fontSize: 24, fontWeight: '800', color: '#1d1d1f', marginTop: 16 },
  userRole: { fontSize: 14, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  section: { padding: 20, paddingTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#6B7280', marginBottom: 12, marginLeft: 4 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 15, color: '#4B5563', marginLeft: 12, fontWeight: '600' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuItemText: { fontSize: 16, fontWeight: '700', color: '#1d1d1f' },
  menuSubText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', marginHorizontal: 24, paddingVertical: 18, borderRadius: 20, marginTop: 10, marginBottom: 40 },
  logoutButtonText: { color: '#EF4444', fontSize: 16, fontWeight: '800', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1d1d1f', marginLeft: 12 },
  modalInput: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveButton: { flex: 1, backgroundColor: '#3B82F6', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: '800' }
});
