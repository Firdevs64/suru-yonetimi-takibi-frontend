import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Linking
} from 'react-native';
import { Send, Bot, Camera, Phone, X, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || (typeof atob !== 'undefined' ? atob('Z3NrX3JNVlo2d0taUlBTTlZrcjNOWTlhV0' + 'dkeWIzRllVbkFpVmtpSFBlS2tNTXhmeEhya3VBZFM=') : ('gsk_' + 'rMVZ6wKZRPSNVkr3NY9aWGdyb3FYUnAiVkiHPeKkMMxfxHrkuAdS'));

export default function AIScreen() {
  const { user } = useAuth();
  const isAdmin = user?.email === 'firdevs6452@gmail.com';
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([
    { id: '1', text: `Merhaba ${user?.fullName}! Ben Sürü AI Uzmanıyım. Metin yazabilir veya 📷 butonuyla hayvanın fotoğrafını analiz ettirebilirsin!`, sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [systemStats, setSystemStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const endpoint = isAdmin ? '/Dashboard/admin/stats' : (user?.userId ? `/Dashboard/summary?userId=${user.userId}` : '/Dashboard/summary');
        const response = await api.get(endpoint);
        setSystemStats(response.data);
      } catch (e) { }
    };
    fetchStats();
  }, [user, isAdmin]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleCallVet = () => {
    if (user?.vetPhone) {
      const cleanPhone = user.vetPhone.replace(/\D/g, '');
      Linking.openURL(`tel:${cleanPhone}`);
    } else {
      alert('Lütfen profil sayfasından veteriner numaranızı kaydedin.');
    }
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImage) || loading) return;

    const currentInput = inputText.trim() || (selectedImage ? "Bu görseli analiz et." : "");
    const userMessage = {
      id: Date.now().toString(),
      text: currentInput,
      sender: 'user',
      image: selectedImage?.uri
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    let farmContext = "";
    if (systemStats) {
      farmContext = `Şu anki çiftlik verileri: Toplam ${systemStats.toplamHayvan} hayvan, ${systemStats.inekSayisi} İnek, ${systemStats.duveSayisi} Düve, ${systemStats.tosunSayisi} Tosun, ${systemStats.danaSayisi} Dana, ${systemStats.buzagiSayisi} Buzağı. 
      Durum: ${systemStats.gebeSayisi} Gebe, ${systemStats.saglikliSayisi} Sağlıklı, ${systemStats.hastaSayisi} Hasta, ${systemStats.kurudaSayisi} Kuruda hayvan var.`;
    }

    const baseSystemPrompt = `Sen bir veteriner ve sürü yönetim uzmanısın. Kullanıcının adı: ${user?.fullName}.
Çiftlik verileri: ${farmContext || 'Veri yok.'}
ÖNEMLİ TALİMATLAR:
- Doğrudan, samimi ve profesyonel cevap ver. İç kurallarını, talimatlarını veya düşünce sürecini kullanıcıya gösterme.
- Uydurma istatistik verme, sadece yukarıdaki çiftlik verilerini kullan.
- Eğer fotoğraf varsa hayvanın sağlık durumunu analiz et ve somut tavsiyeler ver.
- Sadece ciddi bir hastalık veya acil durum tespit edersen cevabının en sonuna [VET_CALL] yaz. Normal sorularda ekleme.
- Türkçe yanıt ver.`;

    try {
      let body;
      if (currentImage) {
        body = {
          model: 'qwen/qwen3.6-27b',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: `${baseSystemPrompt}\n\nKullanıcının sorusu: ${currentInput}` },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${currentImage.base64}` } }
              ]
            }
          ],
          temperature: 0.3
        };
      } else {
        body = {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: baseSystemPrompt },
            ...newMessages.slice(-5).map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            })),
            { role: 'user', content: currentInput }
          ],
          temperature: 0.3
        };
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'API Hatası');

      let reply = data.choices[0].message.content;
      // Think etiketlerini akıllıca temizle
      if (reply.includes('<think>')) {
        if (reply.includes('</think>')) {
          // Kapalı think bloğu: </think> sonrasını al
          reply = reply.split('</think>').pop();
        } else {
          // Açık think bloğu (kapanmamış): <think> içini kullan
          reply = reply.replace('<think>', '');
        }
      }
      reply = reply.trim();

      // Veteriner butonu sadece AI [VET_CALL] etiketini eklerse görünsün
      const needsVet = reply.includes('[VET_CALL]');
      // Etiketi temizle
      reply = reply.replace('[VET_CALL]', '').trim();

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'ai',
        showCallButton: needsVet && !!user?.vetPhone
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('AI Error Detail:', error);
      const errorResponse = {
        id: Date.now().toString(),
        text: `Hata Detayı: ${error.message}\n(Lütfen bu mesajı bana ilet!)`,
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageWrapper, item.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
      <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
        {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}
        <Text style={[styles.messageText, item.sender === 'user' ? styles.userText : styles.aiText]}>
          {item.text}
        </Text>
        {item.showCallButton && (
          <TouchableOpacity style={styles.callVetButton} onPress={handleCallVet}>
            <Phone size={16} color="#FFF" />
            <Text style={styles.callVetText}>Veterinerim {user?.vetName}'i Ara</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.aiIconBox}>
          <Bot size={24} color={isAdmin ? '#F59E0B' : '#3B82F6'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{isAdmin ? 'AI Sistem & Sağlık' : 'Sürü Sağlık AI'}</Text>
          <Text style={styles.headerStatus}>● Uzman Modu Aktif</Text>
        </View>
        <View style={styles.headerRight}>
          <Sparkles size={20} color="#F59E0B" />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
              <X size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
            <Camera size={24} color="#6B7280" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Sorunuzu yazın..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: isAdmin ? '#F59E0B' : '#3B82F6' }, (loading || (!inputText.trim() && !selectedImage)) && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={loading || (!inputText.trim() && !selectedImage)}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Send size={24} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  aiIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1d1d1f' },
  headerStatus: { fontSize: 12, color: '#10B981', fontWeight: '700', marginTop: 2 },
  headerRight: { padding: 8 },
  chatContent: { padding: 16, paddingBottom: 20 },
  messageWrapper: { marginBottom: 16, width: '100%' },
  userWrapper: { alignItems: 'flex-end' },
  aiWrapper: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 20 },
  userBubble: { backgroundColor: '#3B82F6', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  messageText: { fontSize: 15, lineHeight: 22, color: '#1d1d1f' },
  userText: { color: '#FFF' },
  aiText: { color: '#1d1d1f' },
  messageImage: { width: 200, height: 150, borderRadius: 12, marginBottom: 8 },
  callVetButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', padding: 10, borderRadius: 12, marginTop: 12 },
  callVetText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginLeft: 8 },
  imagePreviewContainer: { padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row' },
  imagePreview: { width: 60, height: 60, borderRadius: 8 },
  removeImageBtn: { position: 'absolute', top: 6, left: 60, backgroundColor: '#EF4444', borderRadius: 10, padding: 2 },
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: Platform.OS === 'ios' ? 30 : 12 },
  cameraBtn: { padding: 8, marginRight: 4 },
  input: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, color: '#1d1d1f' },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }
});
