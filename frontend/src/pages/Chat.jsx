import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiFetch } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { translate, getLanguageCode } from '../utils/translate';
import TranslatedText from '../components/TranslatedText';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const [farmerContext, setFarmerContext] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [contextBadges, setContextBadges] = useState(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  const session = (() => {
    try { return JSON.parse(localStorage.getItem('ammachi_session') || '{}'); } catch { return {}; }
  })();

  useEffect(() => {
    setMessages([{
      id: 1,
      text: `Namaste${session.name ? `, ${session.name}` : ''}! 🙏\n\nI'm **Krishi Sakhi** — your intelligent farming companion powered by AI.\n\nI have access to your **farm data**, **activities**, **government schemes**, **market prices**, and **local agricultural officers** to give you the most personalized advice.\n\n🌾 Ask me anything about farming, crops, weather, pests, government schemes, or market prices!`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'welcome'
    }]);
    fetchFarmerContext();
    fetchSuggestions();
    initializeSpeechRecognition();
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchFarmerContext = async () => {
    if (!session.userId) return;
    try {
      const res = await apiFetch(`/api/farmers/${session.userId}/dashboard/`);
      const data = await res.json();
      setFarmerContext(data);
    } catch (e) { console.error('Context fetch error:', e); }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await apiFetch(`/api/chatbot/suggestions?farmer_id=${session.userId || ''}`);
      const data = await res.json();
      if (data.success) setSuggestions(data.data || []);
    } catch (e) {
      setSuggestions([
        'What government schemes can I apply for?',
        'How to improve soil health?',
        'Best crops for this season?',
        'How to protect crops from pests?'
      ]);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = getLanguageCode();
      recognitionRef.current.onresult = (e) => { setInputMessage(e.results[0][0].transcript); setIsListening(false); };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  };

  const startListening = () => { if (recognitionRef.current) { setIsListening(true); recognitionRef.current.start(); } };
  const stopListening = () => { if (recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); } };

  const speakMessage = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\*\*/g, '').replace(/[#*_~`]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = getLanguageCode();
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const sendMessage = async (overrideMsg) => {
    const text = overrideMsg || inputMessage.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Build conversation history for context
    const history = messages.slice(-8).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }));

    try {
      const res = await apiFetch('/api/chatbot/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: language || 'English',
          farmer_id: session.userId,
          conversation_history: history
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg = {
          id: Date.now() + 1,
          text: data.reply,
          sender: 'bot',
          timestamp: new Date(),
          type: data.is_fallback ? 'fallback' : 'advice'
        };
        setMessages(prev => [...prev, botMsg]);
        if (data.context_used) setContextBadges(data.context_used);
      } else {
        // Very rare 500 error case
        const fallback = generateSmartResponse(text, language);
        setMessages(prev => [...prev, { id: Date.now() + 1, text: fallback, sender: 'bot', timestamp: new Date(), type: 'fallback' }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallback = generateSmartResponse(text, language);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: fallback, sender: 'bot', timestamp: new Date(), type: 'fallback' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Auto-resize textarea
  const handleInput = (e) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  // ─── Render a single message with markdown-like formatting ─────
  const renderMessageContent = (text) => {
    if (!text) return null;
    // Simple markdown: bold, bullets, numbered lists
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (/^[\-\•\▸]\s/.test(rendered.trim())) {
        rendered = rendered.replace(/^[\s]*[\-\•\▸]\s*/, '');
        return <div key={i} className="flex gap-2 items-start my-0.5"><span className="text-emerald-500 font-bold mt-0.5 flex-shrink-0">▸</span><span dangerouslySetInnerHTML={{ __html: rendered }} /></div>;
      }
      // Numbered lists
      if (/^\d+[\.\)]\s/.test(rendered.trim())) {
        const num = rendered.match(/^[\s]*(\d+)[\.\)]/)[1];
        rendered = rendered.replace(/^[\s]*\d+[\.\)]\s*/, '');
        return <div key={i} className="flex gap-2 items-start my-0.5"><span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0">{num}</span><span dangerouslySetInnerHTML={{ __html: rendered }} /></div>;
      }
      // Headers (lines starting with #)
      if (/^#{1,3}\s/.test(line)) {
        const headerText = line.replace(/^#{1,3}\s/, '');
        return <div key={i} className="text-emerald-700 font-extrabold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: headerText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
      }
      // URLs
      rendered = rendered.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline hover:text-blue-800 font-medium">$1</a>');
      // Empty line as spacing
      if (!line.trim()) return <div key={i} className="h-2" />;
      return <div key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  const generateSmartResponse = (message, lang) => {
    const lo = message.toLowerCase();
    if (lo.includes('weather') || lo.includes('rain')) return 'For detailed weather forecasts, please visit the **Weather** section from the sidebar. I recommend checking the 5-day forecast before planning any spraying or harvesting activities.';
    if (lo.includes('scheme') || lo.includes('pm-kisan') || lo.includes('government')) return 'You can explore all **National & State Government Schemes** in the **Schemes** section. Popular schemes include PM-KISAN (₹6,000/year), PMFBY crop insurance, and Kisan Credit Card. Visit the Schemes page for official links!';
    if (lo.includes('price') || lo.includes('market') || lo.includes('mandi')) return 'Check the **Market** section for live crop prices in your district. You can view price trends, compare across mandis, and even place buy/sell orders.';
    if (lo.includes('disease') || lo.includes('pest') || lo.includes('insect')) return 'Upload a clear photo of the affected plant on the **Detect** page for AI-powered disease detection. For immediate help, use neem-based organic sprays and ensure proper drainage.';
    if (lo.includes('officer') || lo.includes('consult')) return 'Visit the **Officers** section to find agricultural officers in your district. You can book consultations (phone, video, or farm visit) with experts in crop production, soil health, and pest management.';
    if (lo.includes('fertilizer') || lo.includes('soil')) return 'Get a **Soil Health Card** for free soil testing and fertilizer recommendations. Apply organic compost along with NPK fertilizers. The recommended ratio for most crops is 4:2:1.';
    return "I'm your **Krishi Sakhi** farming companion! I can help with weather, crops, diseases, market prices, government schemes, and officer consultations. Ask me anything specific, or explore the app sections from the sidebar! 🌾";
  };

  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col h-full relative">

        {/* ═══ Premium Header ═══ */}
        <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-3.5 flex justify-between items-center z-10 shadow-lg shadow-emerald-600/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%222%22%20cy%3D%222%22%20r%3D%221%22%20fill%3D%22white%22%20opacity%3D%220.08%22%2F%3E%3C%2Fsvg%3E')]"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl border border-white/20 shadow-inner">
              🌾
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                Krishi Sakhi AI
              </h1>
              <p className="text-emerald-100 text-xs">
                {farmerContext?.farmer
                  ? `Connected to your farm data • ${farmerContext?.farms?.length || 0} farms`
                  : 'Your AI-powered farming assistant'}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            {/* Context indicator */}
            {contextBadges && (
              <button onClick={() => setShowContextPanel(!showContextPanel)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                {contextBadges.has_farms && <span title="Farms" className="text-xs">🌿</span>}
                {contextBadges.has_activities && <span title="Activities" className="text-xs">📋</span>}
                {contextBadges.has_schemes && <span title="Schemes" className="text-xs">🏛️</span>}
                {contextBadges.has_officers && <span title="Officers" className="text-xs">👨‍💼</span>}
                {contextBadges.has_recommendations && <span title="Recommendations" className="text-xs">💡</span>}
                <span className="text-[10px] text-white/70 font-medium ml-1">Context</span>
              </button>
            )}

            <button
              onClick={() => changeLanguage(language === 'Malayalam' ? 'English' : 'Malayalam')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-white/15 backdrop-blur-sm text-white border border-white/20 hover:bg-white/25">
              🌐 {language}
            </button>
          </div>
        </header>

        {/* Context panel (expandable) */}
        {showContextPanel && contextBadges && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-3 border-b border-emerald-100 flex flex-wrap gap-3 text-xs" style={{ animation: 'slideDown 0.2s ease-out' }}>
            <span className="font-bold text-emerald-800">📊 AI Context Active:</span>
            {contextBadges.has_farms && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">🌿 Farms</span>}
            {contextBadges.has_activities && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">📋 Activities</span>}
            {contextBadges.has_schemes && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">🏛️ Schemes</span>}
            {contextBadges.has_officers && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">👨‍💼 Officers</span>}
            {contextBadges.has_recommendations && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-medium">💡 Recommendations</span>}
          </div>
        )}

        {/* ═══ Messages Area ═══ */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4" style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 40%, #f1f5f9 100%)' }}>
          {messages.map((message) => (
            <div key={message.id}
              className={`flex w-full ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: 'slideUp 0.3s ease-out' }}>

              {/* Bot avatar */}
              {message.sender === 'bot' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm text-white shadow-md mr-2 flex-shrink-0 mt-1">
                  🌾
                </div>
              )}

              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl relative group ${message.sender === 'user'
                ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm p-4 shadow-lg shadow-emerald-600/10'
                : 'bg-white text-gray-800 border border-gray-100/80 rounded-bl-sm p-5 shadow-sm hover:shadow-md transition-shadow'
                }`}>

                {/* Message content */}
                <div className={`text-sm md:text-[15px] leading-relaxed ${message.sender === 'bot' ? 'prose-sm' : ''}`}>
                  {message.sender === 'bot' ? renderMessageContent(message.text) : message.text}
                </div>

                {/* Timestamp + actions */}
                <div className={`flex items-center gap-2 mt-2 ${message.sender === 'user' ? 'justify-end' : 'justify-between'}`}>
                  <span className={`text-[10px] ${message.sender === 'user' ? 'text-emerald-200' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {message.sender === 'bot' && message.type !== 'welcome' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => speakMessage(message.text)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Listen">
                        🔊
                      </button>
                      <button onClick={() => navigator.clipboard?.writeText(message.text.replace(/\*\*/g, ''))}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="Copy">
                        📋
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* User avatar */}
              {message.sender === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm text-white shadow-md ml-2 flex-shrink-0 mt-1">
                  👤
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start" style={{ animation: 'slideUp 0.2s ease-out' }}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm text-white shadow-md mr-2 flex-shrink-0">
                🌾
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
                <span className="text-xs text-gray-400 font-medium">Analyzing your farm data...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ═══ Input Area ═══ */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200 p-3 md:p-4">
          {/* Dynamic suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {(suggestions.length > 0 ? suggestions.slice(0, 6) : [
              'What schemes can I apply for?',
              'How to improve my yield?',
              'Best crops for this season?',
              'Contact an officer near me'
            ]).map((s, i) => (
              <button key={i}
                onClick={() => sendMessage(s)}
                className="whitespace-nowrap px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-bold rounded-xl hover:from-emerald-100 hover:to-teal-100 border border-emerald-100 transition-all hover:-translate-y-0.5 shadow-sm">
                {s}
              </button>
            ))}
          </div>

          <div className="max-w-4xl mx-auto flex items-end gap-2">
            <div className="flex-1 relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white transition-all">
              <textarea ref={textareaRef}
                value={inputMessage}
                onChange={handleInput}
                onKeyPress={handleKeyPress}
                placeholder={translate('Ask about crops, weather, schemes, prices...')}
                rows={1}
                disabled={isLoading}
                className="w-full pl-4 pr-12 py-3.5 bg-transparent rounded-2xl focus:outline-none font-medium text-gray-800 placeholder-gray-400 resize-none text-sm"
                style={{ minHeight: '48px', maxHeight: '120px' }} />

              <button
                onClick={isListening ? stopListening : startListening}
                className={`absolute right-3 bottom-2.5 p-2 rounded-xl transition-all ${isListening
                  ? 'bg-red-100 text-red-600 animate-pulse shadow-lg shadow-red-200'
                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                title={isListening ? 'Stop listening' : 'Voice input'}>
                {isListening ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 19v3m-3 0h6M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z" /></svg>
                )}
              </button>
            </div>

            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105 active:scale-95 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
            Uses your farm data for personalized advice
          </p>
        </div>
      </main>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
