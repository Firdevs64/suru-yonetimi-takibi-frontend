import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ImagePlus, X } from 'lucide-react';

const AIChat = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Merhaba! Ben sürünüz için özel olarak eğitilmiş Yapay Zeka Uzmanıyım. Metin sorusu yazabilir veya 📷 butonuyla hayvanın fotoğrafını yükleyebilirsiniz!' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // base64
  const [imagePreview, setImagePreview] = useState(null);   // önizleme URL
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Görsel seçilince base64'e çevir
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);           // önizleme için tam URL
      setSelectedImage(reader.result);          // base64 (data:image/...;base64,xxx)
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    const userText = inputText || 'Bu görseli analiz et ve hayvanla ilgili ne gözlemliyorsun?';
    const userImage = selectedImage;

    setInputText('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Kullanıcı mesajını ekle (görsel varsa önizlemeyle)
    setMessages(prev => [...prev, {
      role: 'user',
      text: userText,
      image: userImage
    }]);
    setLoading(true);

    try {
      let requestBody;

      if (userImage) {
        // Görsel varsa: Vision modeli kullan
        const base64Data = userImage.split(',')[1]; // "data:image/jpeg;base64," kısmını at
        const mimeType = userImage.split(';')[0].split(':')[1]; // "image/jpeg"

        requestBody = {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'system',
              content: 'Sen bir hayvancılık ve veterinerlik uzmanısın. Görseldeki hayvanı analiz et, Türkçe kısa ve pratik tavsiyeler ver. Hastalık, yaralanma veya anormal durumları tespit et.'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: userText },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`
                  }
                }
              ]
            }
          ],
          temperature: 0.7,
          max_tokens: 600
        };
      } else {
        // Sadece metin: Normal model
        requestBody = {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Sen bir hayvancılık ve sürü yönetimi uzmanısın. Sadece Türkçe cevap ver. Kısa, net ve pratik ol.'
            },
            { role: 'user', content: userText }
          ],
          temperature: 0.7,
          max_tokens: 500
        };
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || 'API hatası');
      }

      const reply = data?.choices?.[0]?.message?.content || 'Cevap alınamadı.';
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      console.error('Hata:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Bağlantı hatası: ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-fade-in relative">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-primary-600 rounded-xl shadow-sm">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Sürü Danışmanı</h1>
          <p className="text-sm text-gray-500">Yapay zeka destekli sağmal ve besi analizi — Görsel analiz destekli.</p>
        </div>
      </div>

      {/* Mesajlar */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8 space-y-6"
      >
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-primary-100 text-primary-700' : 'bg-blue-600 text-white'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-sm text-[15px] leading-relaxed space-y-2
              ${msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-tr-none'
                : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'}`}>
              {/* Görsel varsa göster */}
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Yüklenen görsel"
                  className="rounded-xl max-h-48 object-cover w-full mb-2"
                />
              )}
              <span>{msg.text}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-6 py-5 flex items-center gap-2 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Görsel önizleme */}
      {imagePreview && (
        <div className="relative inline-block w-fit">
          <img src={imagePreview} alt="Önizleme" className="h-20 rounded-xl border border-gray-200 shadow-sm" />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input alanı */}
      <form onSubmit={sendMessage} className="relative mt-2 flex items-center gap-2">
        {/* Görsel yükleme butonu */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary-600 hover:border-primary-400 cursor-pointer transition-colors shadow-sm"
          title="Görsel yükle"
        >
          <ImagePlus className="w-5 h-5" />
        </label>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={selectedImage ? "Görselle ilgili sorunuzu yazın... (boş bırakabilirsiniz)" : "Soru yazın veya görsel yükleyin..."}
          className="flex-1 bg-white border border-gray-200 rounded-2xl py-4 pl-6 pr-4 shadow-sm text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-[15px]"
        />

        <button
          type="submit"
          disabled={loading || (!inputText.trim() && !selectedImage)}
          className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-300 transition-colors shadow-sm"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default AIChat;
