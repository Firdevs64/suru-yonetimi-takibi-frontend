import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { Mail, Lock, User, Phone, Eye, EyeOff, UserPlus } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { registerUser } = useAuth();

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    const result = await registerUser(formData);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Kayıt Başarısız', result.message || 'Sunucuya bağlanılamadı. Lütfen IP adresinizi kontrol edin.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ImageBackground source={require('../../assets/login_header.png')} style={styles.headerImage} resizeMode="cover">
          <View style={styles.overlay} />
        </ImageBackground>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.subtitle}>Sisteme katılmak için bilgilerinizi girin.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}><User size={20} color="#9CA3AF" /></View>
              <TextInput style={styles.input} placeholder="Adınız Soyadınız" value={formData.name} onChangeText={(val) => setFormData({ ...formData, name: val })} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}><Mail size={20} color="#9CA3AF" /></View>
              <TextInput style={styles.input} placeholder="eposta@ornek.com" value={formData.email} onChangeText={(val) => setFormData({ ...formData, email: val })} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}><Phone size={20} color="#9CA3AF" /></View>
              <TextInput style={styles.input} placeholder="05XX XXX XX XX" value={formData.phone} onChangeText={(val) => setFormData({ ...formData, phone: val })} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}><Lock size={20} color="#9CA3AF" /></View>
              <TextInput style={styles.input} placeholder="••••••••" value={formData.password} onChangeText={(val) => setFormData({ ...formData, password: val })} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}</TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={styles.registerButtonText}>Hesap Oluştur</Text><UserPlus size={20} color="#FFF" style={{ marginLeft: 10 }} /></View>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabınız var mı? <Text style={styles.footerTextBold}>Giriş Yap</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1 },
  headerImage: { width: '100%', height: 300, justifyContent: 'flex-end' },
  overlay: { height: '100%', backgroundColor: 'rgba(0,0,0,0.1)' },
  formContainer: { flex: 1, padding: 24, marginTop: -30, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: '#1d1d1f', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#9CA3AF', marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB', height: 60 },
  iconBox: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1d1d1f' },
  registerButton: { backgroundColor: '#4ca02e', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#4ca02e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  registerButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  footer: { marginTop: 32, alignItems: 'center', paddingBottom: 20 },
  footerText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  footerTextBold: { color: '#4ca02e', fontWeight: '900' },
});
