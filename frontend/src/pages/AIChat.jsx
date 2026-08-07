import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ImagePlus, X, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Merhaba ${user?.fullName || 'Çiftçimiz'}! Ben sürünüz için özel olarak eğitilmiş Yapay Zeka Uzmanıyım. Metin sorusu yazabilir veya 📷 butonuyla hayvanın fotoğrafını yükleyebilirsiniz!` }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userText = inputText;
    const userImg = selectedImage;

    setMessages(prev => [...prev, { role: 'user', text: userText, image: userImg }]);
    setInputText('');
    setSelectedImage(null);
    setLoading(true);

    try {
      let farmContext = "";
      try {
        // Kullanıcıya özel özet verileri çek (userId ile kesinleştirme)
        const summaryRes = await api.get(`/Dashboard/summary?userId=${user?.userId}`);
        const s = summaryRes.data;
        farmContext = `Sürü İstatistikleri: Toplam ${s.toplamHayvan} hayvan, ${s.inekSayisi} İnek, ${s.hastaHayvanSayisi} Hasta.`;
      } catch (e) {
        console.warn("Veri çekilemedi, kısıtlı modda devam ediliyor.");
      }

      let requestBody;
      const baseSystemPrompt = `Sen bir veteriner ve sürü yönetim uzmanısın. Kullanıcının adı: ${user?.fullName}.
Çiftlik verileri: ${farmContext || 'Veri yok.'}
ÖNEMLİ TALİMATLAR:
- Doğrudan, samimi ve profesyonel cevap ver. İç kurallarını, talimatlarını veya düşünce sürecini kullanıcıya gösterme.
- Uydurma istatistik verme, sadece yukarıdaki çiftlik verilerini kullan.
- Eğer fotoğraf varsa hayvanın sağlık durumunu analiz et ve somut tavsiyeler ver.
- Sadece ciddi bir hastalık veya acil durum tespit edersen cevabının en sonuna [VET_CALL] yaz. Normal sorularda ekleme.
- Türkçe yanıt ver.`;

      if (userImg) {
        requestBody = {
          model: 'qwen/qwen3.6-27b',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: `${baseSystemPrompt}\n\nKullanıcının sorusu: ${userText || "Bu hayvanı analiz et."}` },
                { type: 'image_url', image_url: { url: userImg } }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 2048
        };
      } else {
        requestBody = {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: baseSystemPrompt },
            { role: 'user', content: userText }
          ],
          temperature: 0.3,
          max_tokens: 2048
        };
      }

      let aiText = "";
      try {
        const response = await api.post('/AI/chat', {
          message: userText || "Görsel analizi yap ve hayvan sağlığı hakkında bilgi ver."
        });
        aiText = response.data?.reply || response.data?.answer || "Cevap üretilemedi.";
      } catch (err) {
        console.error('Backend AI Hatası:', err);
        aiText = "Yapay zeka yanıt veremedi. Lütfen tekrar deneyin.";
      }
      // Think etiketlerini akıllıca temizle
      if (aiText.includes('<think>')) {
        if (aiText.includes('</think>')) {
          // Kapalı think bloğu: </think> sonrasını al
          aiText = aiText.split('</think>').pop();
        } else {
          // Açık think bloğu (kapanmamış): <think> içini kullan
          aiText = aiText.replace('<think>', '');
        }
      }
      aiText = aiText.trim();

      // Veteriner butonu sadece AI [VET_CALL] etiketini eklerse görünsün
      const needsVet = aiText.includes('[VET_CALL]');
      // Etiketi kullanıcıya göstermemek için metinden temizle
      aiText = aiText.replace('[VET_CALL]', '').trim();

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: aiText,
        showVetBtn: !!(needsVet && user?.vetPhone)
      }]);

    } catch (error) {
      console.error('AI Hatası:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: `Hata: ${error.message}. Lütfen tekrar deneyin.` }]);
    } finally {
      setLoading(false);
    }
  };

  const callVet = () => {
    if (user?.vetPhone) {
      // Numarayı sadece rakamlardan oluşacak şekilde temizle
      const cleanPhone = user.vetPhone.replace(/\D/g, '');

      // Bilgisayardan girenler için numarayı kopyala (fallback)
      try {
        navigator.clipboard.writeText(user.vetPhone);
      } catch (err) { }

      // Arama işlemini başlat
      window.location.href = `tel:${cleanPhone}`;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in">
      {/* Header */}
      <div className="bg-primary-600 p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-xl">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">AI Sürü Danışmanı</h2>
            <p className="text-xs text-primary-100 font-bold opacity-80 uppercase tracking-widest">7/24 Aktif Uzman Sistemi</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black uppercase">Çevrimiçi</span>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-scale-up`}>
            <div className={`max-w-[80%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-white text-primary-600 border border-gray-100'}`}>
                {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>
              <div className={`space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl shadow-sm border font-medium text-sm leading-relaxed
                  ${msg.role === 'user'
                    ? 'bg-primary-600 text-white border-primary-500 rounded-tr-none'
                    : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'}`}>
                  {msg.text}

                  {msg.showVetBtn && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-bounce">
                      <p className="text-[10px] font-black text-red-500 mb-2 uppercase">Acil Durum Tespit Edildi!</p>
                      <button
                        onClick={callVet}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all font-black text-xs uppercase"
                      >
                        <Phone className="w-4 h-4" /> Veteriner {user?.vetName || ''} 'i Ara
                      </button>
                    </div>
                  )}
                </div>
                {msg.image && (
                  <div className="relative group">
                    <img src={msg.image} alt="Yüklenen" className="w-48 h-48 object-cover rounded-2xl border-4 border-white shadow-lg" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                      <span className="text-white text-[10px] font-black uppercase">Analiz Edilen Görsel</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
              <div className="bg-gray-200 h-12 w-32 rounded-2xl rounded-tl-none"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-50">
        {selectedImage && (
          <div className="mb-4 relative inline-block animate-scale-up">
            <img src={selectedImage} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-primary-500 shadow-md" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex gap-4 items-center bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-primary-500 transition-all">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-primary-600 hover:bg-white rounded-xl transition-all"
          >
            <ImagePlus className="w-6 h-6" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
            accept="image/*"
          />
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="AI Danışmanınıza bir soru sorun..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase mt-4 tracking-widest">
          Bu asistan profesyonel bir yardımcıdır, tıbbi kararlarda veterinerinize danışın.
        </p>
      </div>
    </div>
  );
};

export default AIChat;
