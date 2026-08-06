import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  Switch,
  Alert
} from 'react-native';
import { LayoutDashboard, Users, PawPrint, Droplet, Baby, Stethoscope, History, Settings, ShieldAlert } from 'lucide-react-native';
import api from '../api/axios';

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [systemSettings, setSystemSettings] = useState({ maintenanceMode: false, stopNewRegistrations: false });

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, settingsRes] = await Promise.all([
        api.get('/Dashboard/admin/stats'),
        api.get('/Settings')
      ]);
      setStats(statsRes.data);
      setSystemSettings(settingsRes.data);
    } catch (error) {
      console.error('Admin istatistikleri çekilemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const toggleSetting = async (key, value) => {
    const newSettings = { ...systemSettings, [key]: value };
    try {
      await api.put('/Settings', newSettings);
      setSystemSettings(newSettings);
      Alert.alert('Başarılı', `${key === 'maintenanceMode' ? 'Bakım Modu' : 'Yeni Kayıtlar'} güncellendi.`);
    } catch (error) {
      Alert.alert('Hata', 'Ayarlar güncellenemedi.');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingText}>Sistem verileri yükleniyor...</Text>
      </View>
    );
  }

  const totalAnimals = stats?.animalDistribution?.reduce((acc, curr) => acc + curr.value, 0) || 0;
  const findVal = (name) => stats?.animalDistribution?.find(a => a.name === name)?.value || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />}
      >
        <Text style={styles.headerTitle}>Sistem Özeti</Text>

        {/* Hızlı Kontroller */}
        <View style={styles.controlsSection}>
          <View style={styles.controlCard}>
            <View style={styles.controlInfo}>
              <ShieldAlert size={20} color={systemSettings.maintenanceMode ? "#EF4444" : "#10B981"} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.controlTitle}>Bakım Modu</Text>
                <Text style={styles.controlSub}>{systemSettings.maintenanceMode ? "Sistem dışa kapalı" : "Tüm sistemler aktif"}</Text>
              </View>
            </View>
            <Switch 
              value={systemSettings.maintenanceMode} 
              onValueChange={(val) => toggleSetting('maintenanceMode', val)}
              trackColor={{ false: '#D1D5DB', true: '#EF4444' }}
            />
          </View>

          <View style={styles.controlCard}>
            <View style={styles.controlInfo}>
              <Users size={20} color={systemSettings.stopNewRegistrations ? "#F97316" : "#3B82F6"} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.controlTitle}>Yeni Kayıtlar</Text>
                <Text style={styles.controlSub}>{systemSettings.stopNewRegistrations ? "Durduruldu" : "Kayıt alınıyor"}</Text>
              </View>
            </View>
            <Switch 
              value={systemSettings.stopNewRegistrations} 
              onValueChange={(val) => toggleSetting('stopNewRegistrations', val)}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            />
          </View>
        </View>
        
        <View style={styles.grid}>
          {/* Ana İstatistikler */}
          <View style={[styles.statCard, { width: '100%', flexDirection: 'row', alignItems: 'center' }]}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF', marginBottom: 0 }]}>
              <Users size={24} color="#6366F1" />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Toplam Kayıtlı Çiftçi</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <PawPrint size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{totalAnimals}</Text>
            <Text style={styles.statLabel}>Toplam Hayvan</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
              <PawPrint size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{findVal('İnek')}</Text>
            <Text style={styles.statLabel}>Toplam İnek</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <PawPrint size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{findVal('Düve')}</Text>
            <Text style={styles.statLabel}>Toplam Düve</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <PawPrint size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{findVal('Tosun')}</Text>
            <Text style={styles.statLabel}>Toplam Tosun</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <Baby size={24} color="#A855F7" />
            </View>
            <Text style={styles.statValue}>{findVal('Dana')}</Text>
            <Text style={styles.statLabel}>Toplam Dana</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FCE7F3' }]}>
              <Baby size={24} color="#EC4899" />
            </View>
            <Text style={styles.statValue}>{findVal('Buzağı')}</Text>
            <Text style={styles.statLabel}>Toplam Buzağı</Text>
          </View>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <History size={20} color="#1d1d1f" />
            <Text style={styles.sectionTitle}>Son Kayıtlar</Text>
          </View>
          
          {stats?.recentActivities?.length > 0 ? stats.recentActivities.map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <Text style={styles.activityText}>• {activity.text}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          )) : (
            <Text style={styles.noActivity}>Henüz bir aktivite yok.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1d1d1f', marginBottom: 24 },
  controlsSection: { marginBottom: 20, gap: 12 },
  controlCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  controlInfo: { flexDirection: 'row', alignItems: 'center' },
  controlTitle: { fontSize: 16, fontWeight: '800', color: '#1d1d1f' },
  controlSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '47%', backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1d1d1f' },
  statLabel: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  recentSection: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1d1d1f', marginLeft: 8 },
  activityCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  activityText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
  activityTime: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  loadingText: { marginTop: 12, color: '#6B7280', fontWeight: '600' },
  noActivity: { color: '#9CA3AF', textAlign: 'center', marginTop: 20 }
});
