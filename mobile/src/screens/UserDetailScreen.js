import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { ChevronLeft, PawPrint, Droplet, Baby, Stethoscope, Mail, Phone } from 'lucide-react-native';
import api from '../api/axios';

export default function UserDetailScreen({ route, navigation }) {
  const { userId, userName, userEmail, userPhone } = route.params;
  const [summary, setSummary] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Firdevs Köse admin olduğu için ona özel etiket
  const isAdmin = userEmail === 'firdevs6452@gmail.com';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        if (!isAdmin) {
          const [sumRes, animRes] = await Promise.all([
            api.get(userId ? `/Dashboard/summary?userId=${userId}` : '/Dashboard/summary'),
            api.get(userId ? `/Animals?userId=${userId}` : '/Animals')
          ]);
          setSummary(sumRes.data);
          setAnimals(animRes.data);
        }
      } catch (error) {
        console.error('Veriler çekilemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, isAdmin]);

  // Güvenli render için değerleri hazırla
  const initialLetter = String(userName || 'U').charAt(0).toUpperCase();
  const displaySummary = summary || { toplamHayvan: 0, sagmalSayisi: 0, gebeSayisi: 0, bosSayisi: 0 };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1d1d1f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kullanıcı Detayı</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.userCard}>
          <View style={[styles.avatar, isAdmin && { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>
          <Text style={styles.userName}>{String(userName || 'İsimsiz')}</Text>
          <Text style={[styles.userRole, isAdmin && { color: '#F59E0B' }]}>
            {isAdmin ? 'Sistem Yöneticisi' : 'Sistem Çiftçisi'}
          </Text>

          <View style={styles.contactRow}>
            <Mail size={16} color="#9CA3AF" />
            <Text style={styles.contactText}>{String(userEmail || '-')}</Text>
          </View>
          {userPhone ? (
            <View style={styles.contactRow}>
              <Phone size={16} color="#9CA3AF" />
              <Text style={styles.contactText}>{String(userPhone)}</Text>
            </View>
          ) : null}
        </View>

        {!isAdmin && (
          <View>
            <Text style={styles.sectionTitle}>Sürü İstatistikleri</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.grid}>
                <View style={styles.statCard}>
                  <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                    <PawPrint size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.statValue}>{String(displaySummary.toplamHayvan)}</Text>
                  <Text style={styles.statLabel}>Toplam Hayvan</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Droplet size={24} color="#10B981" />
                  </View>
                  <Text style={styles.statValue}>{String(displaySummary.sagmalSayisi)}</Text>
                  <Text style={styles.statLabel}>Sağmal</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                    <Baby size={24} color="#6366F1" />
                  </View>
                  <Text style={styles.statValue}>{String(displaySummary.gebeSayisi)}</Text>
                  <Text style={styles.statLabel}>Gebe</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                    <Stethoscope size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.statValue}>{String(displaySummary.bosSayisi)}</Text>
                  <Text style={styles.statLabel}>Boş</Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Kullanıcı Sürüsü ({String(displaySummary.toplamHayvan)})</Text>

            {loading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <View style={styles.animalListContainer}>
                {animals && animals.length > 0 ? (
                  animals.map((animal, index) => (
                    <View key={index} style={styles.animalItem}>
                      <View>
                        <Text style={styles.animalNameText}>{String(animal.name || 'İsimsiz')}</Text>
                        <Text style={styles.animalTagText}>{String(animal.tagNumber || '-')}</Text>
                      </View>
                      <View style={styles.animalBadge}>
                        <Text style={styles.animalBadgeText}>{String(animal.type || 'Bilinmiyor')}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Henüz hayvan kaydı bulunamadı.</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1d1d1f' },
  content: { padding: 20 },
  userCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  userName: { fontSize: 22, fontWeight: '800', color: '#1d1d1f' },
  userRole: { fontSize: 14, color: '#3B82F6', fontWeight: '700', marginBottom: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  contactText: { fontSize: 14, color: '#6B7280', marginLeft: 8, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1d1d1f', marginBottom: 16, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '47%', backgroundColor: '#FFF', padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1d1d1f' },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '700' },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  animalListContainer: { marginTop: 10, paddingBottom: 40 },
  animalItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#3B82F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  animalNameText: { fontSize: 16, fontWeight: '800', color: '#1d1d1f' },
  animalTagText: { fontSize: 12, color: '#3B82F6', fontWeight: '700', marginTop: 2 },
  animalBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  animalBadgeText: { fontSize: 10, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontWeight: '600', marginTop: 20, fontStyle: 'italic' }
});
