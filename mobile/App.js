import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AnimalListScreen from './src/screens/AnimalListScreen';
import AnimalDetailScreen from './src/screens/AnimalDetailScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import UserListScreen from './src/screens/UserListScreen';
import UserDetailScreen from './src/screens/UserDetailScreen';
import AIScreen from './src/screens/AIScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LayoutDashboard, PawPrint, Bell, User, Users, BotMessageSquare } from 'lucide-react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ADMIN İÇİN ÖZEL STACK (Kullanıcı detayına gidebilmek için)
function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserList" component={UserListScreen} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="AdminAnimalList" component={AnimalListScreen} />
    </Stack.Navigator>
  );
}

function UserTabNavigator() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Özet') return <LayoutDashboard size={size} color={color} />;
          if (route.name === 'Sürü') return <PawPrint size={size} color={color} />;
          if (route.name === 'Bildirimler') return <Bell size={size} color={color} />;
          if (route.name === 'AI Asistan') return <BotMessageSquare size={size} color={color} />;
          if (route.name === 'Profil') return <User size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 10 },
        headerStyle: { backgroundColor: '#F9FAFB', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '800', fontSize: 20 },
        headerRight: () => (
          <View style={{ marginRight: 20, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#3B82F6' }}>{user?.fullName?.split(' ')[0] || 'Çiftçi'}</Text>
            <Text style={{ fontSize: 9, color: '#9CA3AF', fontWeight: '800' }}>{user?.role?.toUpperCase() || 'ÜYE'}</Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Özet" component={DashboardScreen} />
      <Tab.Screen name="Sürü" component={AnimalListScreen} options={{ title: 'Hayvanlarım' }} />
      <Tab.Screen name="Bildirimler" component={NotificationsScreen} />
      <Tab.Screen name="AI Asistan" component={AIScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminTabNavigator() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Sistem Özet') return <LayoutDashboard size={size} color={color} />;
          if (route.name === 'Kullanıcılar') return <Users size={size} color={color} />;
          if (route.name === 'AI Asistan') return <BotMessageSquare size={size} color={color} />;
          if (route.name === 'Profil') return <User size={size} color={color} />;
        },
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 10 },
        headerStyle: { backgroundColor: '#F9FAFB', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '800', fontSize: 20 },
        headerRight: () => (
          <View style={{ marginRight: 20, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 13, fontWeight: '900', color: '#F59E0B' }}>{user?.fullName?.split(' ')[0] || 'Admin'}</Text>
            <Text style={{ fontSize: 9, color: '#9CA3AF', fontWeight: '800' }}>{user?.role?.toUpperCase() || 'YÖNETİCİ'}</Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Sistem Özet" component={AdminDashboardScreen} />
      <Tab.Screen name="Kullanıcılar" component={AdminStack} />
      <Tab.Screen name="AI Asistan" component={AIScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigation() {
  const { user, loading } = useAuth();
  const isAdmin = user?.email === 'firdevs6452@gmail.com';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen
              name="Main"
              component={isAdmin ? AdminTabNavigator : UserTabNavigator}
            />
            <Stack.Screen name="AnimalDetail" component={AnimalDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ presentation: 'fullScreenModal' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  }
});
