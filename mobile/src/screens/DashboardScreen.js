import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { PawPrint, Baby, Stethoscope, Droplet, CloudOff, Activity, CheckCircle, ChevronRight, Scan } from 'lucide-react-native';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get(user?.userId ? `/Dashboard/summary?userId=${user.userId}` : '/Dashboard/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Sürü özeti çekilemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [fetchSummary])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Sürü verileri yükleniyor...</Text>
      </View>
    );
  }

  const animalTypes = [
    { label: 'İnek', value: summary?.inekSayisi || 0, color: '#3B82F6' },
    { label: 'Düve', value: summary?.duveSayisi || 0, color: '#10B981' },
    { label: 'Tosun', value: summary?.tosunSayisi || 0, color: '#F59E0B' },
    { label: 'Dana', value: summary?.danaSayisi || 0, color: '#6366F1' },
    { label: 'Buzağı', value: summary?.buzagiSayisi || 0, color: '#EC4899' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
      >
        <Text style={styles.headerTitle}>Sürü Özeti</Text>
        
        {user?.role !== 'Sistem Yöneticisi' ? (
          <>
            {/* Hızlı Tarama Alanı */}
            <TouchableOpacity 
              style={styles.scanActionCard}
              onPress={() => navigation.getParent()?.navigate('Scanner')}
            >
              <View style={styles.scanIconBox}>
                <Scan size={28} color="#FFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.scanTitle}>Küpe Okut</Text>
                <Text style={styles.scanSub}>Hayvan detayına gitmek için kamerayı kullanın</Text>
              </View>
              <ChevronRight color="#3B82F6" size={24} />
            </TouchableOpacity>

            <View style={styles.grid}>
              <View style={[styles.statCard, { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6' }]}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 0 }]}>
                  <Activity size={24} color="#FFF" />
                </View>
                <View style={{ marginLeft: 16 }}>
                  <Text style={[styles.statValue, { color: '#FFF' }]}>{summary?.toplamHayvan || 0}</Text>
                  <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Toplam Hayvan Sayısı</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('Sürü', { filter: 'Gebe' })}
              >
                <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Baby size={24} color="#6366F1" />
                </View>
                <Text style={styles.statValue}>{summary?.gebeSayisi || 0}</Text>
                <Text style={styles.statLabel}>Gebe</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('Sürü', { filter: 'Boş' })}
              >
                <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
                  <CheckCircle size={24} color="#0EA5E9" />
                </View>
                <Text style={styles.statValue}>{summary?.bosSayisi || 0}</Text>
                <Text style={styles.statLabel}>Boş</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('Sürü', { filter: 'Sağmal' })}
              >
                <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Droplet size={24} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{summary?.sagmalSayisi || 0}</Text>
                <Text style={styles.statLabel}>Sağmal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => navigation.navigate('Sürü', { filter: 'Kuruda' })}
              >
                <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                  <CloudOff size={24} color="#F97316" />
                </View>
                <Text style={styles.statValue}>{summary?.kurudaSayisi || 0}</Text>
                <Text style={styles.statLabel}>Kuruda</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.statCard, { width: '100%', borderColor: '#FEE2E2', borderWidth: 1 }]}
                onPress={() => navigation.navigate('Sürü', { filter: 'Hasta' })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.iconBox, { backgroundColor: '#FEF2F2', marginBottom: 0 }]}>
                        <Stethoscope size={24} color="#EF4444" />
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.statValue, { color: '#EF4444' }]}>{summary?.hastaSayisi || 0}</Text>
                        <Text style={styles.statLabel}>Hasta Hayvanlar</Text>
                      </View>
                   </View>
                   <ChevronRight color="#EF4444" size={20} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Tür Dağılımı */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hayvan Türleri</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {animalTypes.map((type, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[
                      styles.typeCard, 
                      { width: '31%', marginBottom: 12, marginRight: 0 },
                      (idx % 3 !== 2) && { marginRight: '3.5%' }
                    ]}
                    onPress={() => navigation.navigate('Sürü', { filter: type.label })}
                  >
                    <View style={[styles.typeIndicator, { backgroundColor: type.color }]} />
                    <Text style={styles.typeValue}>{type.value}</Text>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.adminWelcome}>
            <Text style={styles.adminWelcomeText}>Hoş geldiniz Sayın Yönetici,</Text>
            <Text style={styles.adminWelcomeSub}>Sistem genelindeki verilere "Sistem Özet" sekmesinden ulaşabilirsiniz.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1d1d1f', marginBottom: 24, letterSpacing: -1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '47%', backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1d1d1f' },
  statLabel: { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontWeight: '700' },
  loadingText: { marginTop: 12, color: '#6B7280', fontWeight: '600' },
  section: { marginTop: 10, marginBottom: 30 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1d1d1f', marginBottom: 16 },
  typeScroll: { paddingRight: 20 },
  typeCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginRight: 12, width: 100, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  typeIndicator: { width: 12, height: 4, borderRadius: 2, marginBottom: 8 },
  typeValue: { fontSize: 20, fontWeight: '800', color: '#1d1d1f' },
  typeLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
  adminWelcome: { backgroundColor: '#FFF', padding: 30, borderRadius: 24, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  adminWelcomeText: { fontSize: 20, fontWeight: '800', color: '#1d1d1f', textAlign: 'center' },
  adminWelcomeSub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  scanActionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 28, marginBottom: 24, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4, borderWidth: 1, borderColor: '#EFF6FF' },
  scanIconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  scanTitle: { fontSize: 20, fontWeight: '900', color: '#1d1d1f' },
  scanSub: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }
});
