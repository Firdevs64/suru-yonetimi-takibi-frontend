import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  SafeAreaView, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { Users, Mail, Phone, ChevronRight, UserCheck } from 'lucide-react-native';
import api from '../api/axios';

export default function UserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/Users');
        setUsers(response.data);
      } catch (error) {
        console.error('Kullanıcılar çekilemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('UserDetail', { 
        userId: item.userId, 
        userName: item.fullName,
        userEmail: item.email,
        userPhone: item.phone
      })}
    >
      <View style={styles.avatar}>
        <UserCheck size={24} color="#3B82F6" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.fullName || 'İsimsiz Kullanıcı'}</Text>
        <View style={styles.subInfo}>
          <Mail size={14} color="#9CA3AF" />
          <Text style={styles.subText}>{item.email}</Text>
        </View>
        {item.phone && (
          <View style={styles.subInfo}>
            <Phone size={14} color="#9CA3AF" />
            <Text style={styles.subText}>{item.phone}</Text>
          </View>
        )}
      </View>
      <ChevronRight size={20} color="#E5E7EB" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={item => item.userId.toString()}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.headerTitle}>Kayıtlı Çiftçiler ({users.length})</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1d1d1f', margin: 20, marginBottom: 10 },
  listContent: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1d1d1f' },
  subInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  subText: { fontSize: 13, color: '#6B7280', marginLeft: 6 },
});
