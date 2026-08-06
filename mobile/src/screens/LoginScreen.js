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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Giriş Başarısız', 'Sunucuya bağlanılamadı. Lütfen IP adresinizi kontrol edin veya backendin çalıştığından emin olun.');
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
        <ImageBackground
          source={require('../../assets/login_header.png')}
          style={styles.headerImage}
          resizeMode="cover"
        >
          {/* Yazıları kaldırdık, sadece hafif bir gölge bıraktık ki formla bütünleşsin */}
          <View style={styles.overlay} />
        </ImageBackground>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Üye Girişi</Text>
          <Text style={styles.subtitle}>Hesabınıza erişmek için bilgilerinizi girin.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta Adresi</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}><Mail size={20} color="#9CA3AF" /></View>
              <TextInput
                style={styles.input}
                placeholder="eposta@ornek.com"
                placeholderTextColor="#D1D5DB"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.iconBox}><Lock size={20} color="#9CA3AF" /></View>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#D1D5DB"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Şifremi Unuttum kaldırıldı */}
          <View style={{ height: 20 }} />

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>



          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerTextBold}>Yeni Hesap Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1 },
  headerImage: { width: '100%', height: 350, justifyContent: 'flex-end' },
  overlay: { height: '100%', backgroundColor: 'rgba(0,0,0,0.1)' },
  formContainer: { flex: 1, padding: 24, marginTop: -30, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: '#1d1d1f', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#9CA3AF', marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#1d1d1f', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB', height: 60 },
  iconBox: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1d1d1f' },
  loginButton: { backgroundColor: '#4ca02e', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#4ca02e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  loginButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, paddingBottom: 20 },
  footerText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  footerTextBold: { color: '#4ca02e', fontWeight: '900' },
});
