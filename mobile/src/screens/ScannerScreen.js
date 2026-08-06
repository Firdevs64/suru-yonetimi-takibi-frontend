import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, ZapOff, Camera, RefreshCw } from 'lucide-react-native';
import api from '../api/axios';

export default function ScannerScreen({ navigation, route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermission();
  }, []);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Kameraya erişim izni vermeniz gerekiyor.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleManualScan = async () => {
    if (!cameraRef.current || scanning) return;

    try {
      setScanning(true);

      // Fotoğraf çek (Hızlı olması için kaliteyi düşük tutuyoruz)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });

      // Backend'e gönder (Baştaki / işaretini kaldırdım, axios baseURL ile birleşsin)
      const response = await api.post('Scanner', {
        imageData: photo.base64
      });

      if (response.data.success) {
        if (response.data.animalId) {
          // Hayvan bulundu, detaya git
          navigation.replace('AnimalDetail', { animalId: response.data.animalId });
        } else {
          // Numara okundu ama kayıtlı değil
          Alert.alert('Numara Okundu', `Okunan Numara: ${response.data.tagNumber}\n\nBu numara sistemde kayıtlı değil.`);
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Küpe okunamadı. Lütfen ışığı ve açıyı kontrol edin.';
      Alert.alert('Hata', msg);
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
      />
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Küpe Okut (Yapay Zeka)</Text>
          <TouchableOpacity onPress={() => setTorch(!torch)} style={styles.iconBtn}>
            {torch ? <ZapOff size={24} color="#FFF" /> : <Zap size={24} color="#FFF" />}
          </TouchableOpacity>
        </View>

        <View style={styles.scannerContainer}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            {scanning && <View style={styles.scanLine} />}
          </View>
          <Text style={styles.hint}>Hayvanın küpesindeki numarayı (TR...) çerçeveye ortalayıp butona basın.</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.scanActionBtn, scanning && styles.disabledBtn]}
            onPress={handleManualScan}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <View style={styles.innerCircle}>
                  <Camera size={32} color="#3B82F6" />
                </View>
                <Text style={styles.scanActionText}>NUMARAYI OKU</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const { width } = Dimensions.get('window');
const frameSize = width * 0.75;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  message: { textAlign: 'center', color: '#FFF', marginBottom: 20 },
  button: { backgroundColor: '#3B82F6', padding: 15, borderRadius: 12 },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.4)' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: frameSize, height: frameSize * 0.5, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#3B82F6', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 15 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 15 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 15 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 15 },
  scanLine: { position: 'absolute', left: 10, right: 10, height: 2, backgroundColor: '#3B82F6', top: '50%', shadowColor: '#3B82F6', shadowOpacity: 0.8, shadowRadius: 5, elevation: 5 },
  hint: { color: '#FFF', marginTop: 40, textAlign: 'center', paddingHorizontal: 50, fontSize: 14, fontWeight: '700', lineHeight: 20 },
  footer: { padding: 40, alignItems: 'center', paddingBottom: 60 },
  scanActionBtn: { backgroundColor: '#3B82F6', height: 70, borderRadius: 35, flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 24, shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  innerCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  scanActionText: { color: '#FFF', fontSize: 16, fontWeight: '900', marginLeft: 15 },
  disabledBtn: { opacity: 0.7, justifyContent: 'center' }
});
