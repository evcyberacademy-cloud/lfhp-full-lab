'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  FRONTEND_QA_DATABASE, 
  FrontendQA, 
  FrontendQAService, 
  QuestionCategory, 
  DifficultyLevel 
} from '@/lib/ai-bot/frontend-qa-database';
import { SpeechService, VoiceSettings } from '@/lib/speech/speech-service';
import { SoundEffects } from '@/lib/sounds/sound-effects';
import {
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Code2,
  HelpCircle,
  Settings2,
  Layers,
  ChevronRight,
  Flame,
  Award,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text: string;
  qa?: FrontendQA;
  suggestedQuestions?: FrontendQA[];
}

export const AIBotApp: React.FC = () => {
  const { authState } = useAuth();
  const studentName = authState.student?.studentName || 'Student';

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentQA, setCurrentQA] = useState<FrontendQA | null>(null);

  // Audio / Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingMsgId, setCurrentlySpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(SpeechService.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Navigation / Explorer / Quiz Drawer state
  const [activeTab, setActiveTab] = useState<'chat' | 'catalog' | 'quiz'>('chat');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  // Quiz state
  const [quizQA, setQuizQA] = useState<FrontendQA | null>(null);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  // Clipboard copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech and Initial Greeting
  useEffect(() => {
    SpeechService.init();
    setAvailableVoices(SpeechService.getVoices());

    const unsubscribe = SpeechService.subscribeSpeakingState((speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) setCurrentlySpeakingMsgId(null);
    });

    // Initial Welcome Message from AI Mentor
    const initialQA = FrontendQAService.getById('linux-01') || FRONTEND_QA_DATABASE[0];

    const initialGreeting: ChatMessage = {
      id: 'msg_welcome',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Hello ${studentName}! 🚀 I am your **LFHP AI Lab & Engineering Mentor**.\n\nI have **140+ Questions & Answers** covering our **LFHP Linux Commands** (\`grep\`, \`chmod\`, \`find\`, \`ps\`, \`tar\`), **Networking & Recon** (\`nmap\`, \`ifconfig\`, \`ping\`, \`ss\`, Subnetting), and **Frontend Engineering** (\`React\`, \`JavaScript\`, \`CSS3\`, \`Security\`).\n\nYou can ask any question, practice lab commands, or click the suggested pills below. I can also speak out all answers aloud!`,
      suggestedQuestions: [
        FrontendQAService.getById('linux-01')!,
        FrontendQAService.getById('net-03')!,
        FrontendQAService.getById('js-01')!,
        FrontendQAService.getById('react-01')!,
        FrontendQAService.getById('net-15')!,
      ].filter(Boolean),
    };

    setMessages([initialGreeting]);

    return () => {
      unsubscribe();
      SpeechService.stopSpeaking();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [studentName]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakBotMessage = (text: string, msgId: string) => {
    if (isSpeaking && currentlySpeakingMsgId === msgId) {
      SpeechService.stopSpeaking();
      setCurrentlySpeakingMsgId(null);
      return;
    }

    setCurrentlySpeakingMsgId(msgId);
    SpeechService.speakText(text, {
      onEnd: () => setCurrentlySpeakingMsgId(null),
    });
  };

  const handleSelectQA = (qa: FrontendQA) => {
    SoundEffects.playKeyClick();
    setCurrentQA(qa);
    setActiveTab('chat');

    // Add user question
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: qa.question,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const nextSuggestions = FrontendQAService.getNextSuggestions(qa, 3);
      const botResponseText = `### ${qa.question}\n\n**Category:** \`${qa.category}\` • **Level:** \`${qa.difficulty}\`\n\n${qa.shortAnswer}\n\n${qa.detailedAnswer}`;

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: botResponseText,
        qa,
        suggestedQuestions: nextSuggestions,
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (autoSpeak) {
        speakBotMessage(botResponseText, botMsg.id);
      }
    }, 450);
  };

  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    SoundEffects.playKeyClick();
    setInputText('');

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: query,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const searchResult = FrontendQAService.search(query);
      const matchedQA = searchResult.bestMatch;

      let botText = '';
      let nextSuggestions: FrontendQA[] = [];

      if (matchedQA) {
        setCurrentQA(matchedQA);
        nextSuggestions = FrontendQAService.getNextSuggestions(matchedQA, 3);
        botText = `### ${matchedQA.question}\n\n**Category:** \`${matchedQA.category}\` • **Level:** \`${matchedQA.difficulty}\`\n\n${matchedQA.shortAnswer}\n\n${matchedQA.detailedAnswer}`;
      } else {
        // General search matches or fallback
        const suggestions = searchResult.results.slice(0, 4);
        nextSuggestions = suggestions;
        botText = `I found several frontend topics related to **"${query}"** in our 100+ lab database. Here are the top matches you can explore:`;
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: botText,
        qa: matchedQA,
        suggestedQuestions: nextSuggestions,
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (autoSpeak) {
        speakBotMessage(botText, botMsg.id);
      }
    }, 500);
  };

  // Next Suggested Question Action
  const handleNextSuggestion = () => {
    if (currentQA) {
      const suggestions = FrontendQAService.getNextSuggestions(currentQA, 1);
      if (suggestions.length > 0) {
        handleSelectQA(suggestions[0]);
        return;
      }
    }
    const randomQA = FrontendQAService.getRandom();
    handleSelectQA(randomQA);
  };

  // Random Question Action
  const handleRandomQuestion = () => {
    const randomQA = FrontendQAService.getRandom();
    handleSelectQA(randomQA);
  };

  // Voice Input (Speech Recognition)
  const toggleVoiceInput = () => {
    if (!SpeechService.isSpeechRecognitionSupported()) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome/Edge.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      const recognizer = SpeechService.createSpeechRecognizer(
        (transcript) => {
          setInputText(transcript);
          setIsListening(false);
        },
        (err) => {
          console.error('Speech recognition error:', err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );

      if (recognizer) {
        recognitionRef.current = recognizer;
        recognizer.start();
        setIsListening(true);
      }
    } catch (err) {
      console.error('Voice input start error:', err);
      setIsListening(false);
    }
  };

  // Quiz helper functions
  const startNewQuizQuestion = () => {
    const random = FrontendQAService.getRandom();
    setQuizQA(random);
    setShowQuizAnswer(false);
  };

  const handleQuizGrade = (correct: boolean) => {
    setQuizScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
    if (correct) {
      SoundEffects.playTaskSuccess();
    } else {
      SoundEffects.playError();
    }
    startNewQuizQuestion();
  };

  // Filter Catalog Q&As
  const categories = ['All', ...FrontendQAService.getCategories()];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCatalog = FRONTEND_QA_DATABASE.filter(qa => {
    const matchesSearch = qa.question.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          qa.tags.some(t => t.toLowerCase().includes(catalogSearch.toLowerCase())) ||
                          qa.shortAnswer.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || qa.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || qa.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#030712] text-slate-100 select-text overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-950/90 border-b border-cyan-500/20 backdrop-blur-lg select-none z-20">
        <div className="flex items-center gap-3">
          {/* Academy Logo & Animated AI Bot Icon */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 p-1 flex items-center justify-center shadow-cyber-glow flex-shrink-0">
              <img 
                src="/lfhp-logo.png" 
                alt="LFHP Course Logo" 
                className="w-7 h-7 object-contain drop-shadow-[0_0_6px_rgba(0,240,255,0.7)]" 
              />
            </div>
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center shadow-cyber-glow">
                <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 font-mono tracking-tight">LFHP AI Mentor</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                140+ Linux, Net & Frontend Q&A
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {isSpeaking ? '🔊 Speaking answer out loud...' : 'Ask about Linux commands, Networking, or Frontend'}
            </p>
          </div>
        </div>

        {/* View Tabs & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>100+ Catalog</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('quiz');
                if (!quizQA) startNewQuizQuestion();
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'quiz'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Quiz Mode</span>
            </button>
          </div>

          {/* Quick Random Action */}
          <button
            onClick={handleRandomQuestion}
            title="Get Random Question"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Auto Speak Toggle */}
          <button
            onClick={() => {
              const next = !autoSpeak;
              setAutoSpeak(next);
              SpeechService.updateSettings({ autoSpeak: next });
            }}
            title={autoSpeak ? 'Auto-speak enabled' : 'Auto-speak disabled'}
            className={`p-1.5 rounded-lg border transition-all ${
              autoSpeak
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-cyber-glow'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Voice Settings Gear */}
          <button
            onClick={() => setShowVoiceSettings(prev => !prev)}
            title="Voice & Speech Settings"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Voice Settings Popup Drawer */}
      {showVoiceSettings && (
        <div className="bg-slate-900/95 border-b border-cyan-500/30 p-4 animate-in slide-in-from-top duration-200 select-none z-10">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Text-to-Speech Engine Settings
              </span>
              <button onClick={() => setShowVoiceSettings(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Speech Rate: {voiceSettings.rate}x</label>
                <input
                  type="range"
                  min="0.7"
                  max="1.6"
                  step="0.1"
                  value={voiceSettings.rate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVoiceSettings(prev => ({ ...prev, rate: val }));
                    SpeechService.updateSettings({ rate: val });
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Voice Selection ({availableVoices.length} found)</label>
                <select
                  value={voiceSettings.voiceURI || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVoiceSettings(prev => ({ ...prev, voiceURI: val }));
                    SpeechService.updateSettings({ voiceURI: val });
                  }}
                  className="w-full p-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="">Default Natural Voice</option>
                  {availableVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => SpeechService.speakWelcome(studentName)}
                className="px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs hover:bg-cyan-900/60 transition-colors"
              >
                🔊 Test Welcome Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speech Error Banner */}
      {speechError && (
        <div className="bg-rose-950/80 border-b border-rose-500/40 px-4 py-2 text-rose-300 text-xs font-mono flex items-center justify-between">
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIEW 1: CHAT FEED */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Sender Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      msg.sender === 'user'
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-400'
                        : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-cyber-glow'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Card */}
                  <div className="flex-1 max-w-[85%] space-y-2">
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        msg.sender === 'user'
                          ? 'bg-slate-900/90 border-slate-700/80 text-slate-100 rounded-tr-none'
                          : 'bg-slate-950/85 border-cyan-500/30 text-slate-200 rounded-tl-none shadow-lg'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="text-xs leading-relaxed space-y-2">
                        {msg.text.split('\n\n').map((paragraph, idx) => {
                          if (paragraph.startsWith('### ')) {
                            return (
                              <h3 key={idx} className="text-sm font-bold text-cyan-300 font-mono pb-1 border-b border-cyan-500/20">
                                {paragraph.replace('### ', '')}
                              </h3>
                            );
                          }
                          return (
                            <p key={idx} className="whitespace-pre-wrap">
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>

                      {/* Code Snippet Box if available */}
                      {msg.qa?.codeSnippet && (
                        <div className="mt-3 rounded-xl bg-[#02050e] border border-slate-800 overflow-hidden font-mono text-[11px]">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800/80 text-slate-400">
                            <span className="flex items-center gap-1.5 text-cyan-400">
                              <Code2 className="w-3.5 h-3.5" /> Code Example
                            </span>
                            <button
                              onClick={() => handleCopy(msg.qa!.codeSnippet!, msg.id + '_code')}
                              className="hover:text-white flex items-center gap-1 text-[10px]"
                            >
                              {copiedId === msg.id + '_code' ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 text-emerald-300 overflow-x-auto selection:bg-cyan-500/30">
                            <code>{msg.qa.codeSnippet}</code>
                          </pre>
                        </div>
                      )}

                      {/* Action Bar on Bot Messages */}
                      {msg.sender === 'bot' && (
                        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                          <span className="text-[10px] text-slate-500">{msg.timestamp}</span>

                          <div className="flex items-center gap-2">
                            {/* Speak / Pause Button */}
                            <button
                              onClick={() => speakBotMessage(msg.text, msg.id)}
                              className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors ${
                                currentlySpeakingMsgId === msg.id
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 animate-pulse'
                                  : 'hover:bg-slate-800 hover:text-cyan-300'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{currentlySpeakingMsgId === msg.id ? 'Stop Voice' : 'Speak'}</span>
                            </button>

                            {/* Copy Answer Button */}
                            <button
                              onClick={() => handleCopy(msg.text, msg.id)}
                              className="px-2 py-1 rounded hover:bg-slate-800 hover:text-slate-200 flex items-center gap-1 transition-colors"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SUGGESTED NEXT QUESTIONS BUTTONS PILLS */}
                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Next Suggested Questions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedQuestions.map((sug) => (
                            <button
                              key={sug.id}
                              onClick={() => handleSelectQA(sug)}
                              className="text-left text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950/70 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all hover:scale-[1.02] flex items-center gap-1.5 group shadow-sm"
                            >
                              <span className="text-cyan-400 font-mono text-[10px]">[{sug.category.split(' ')[0]}]</span>
                              <span className="line-clamp-1">{sug.question}</span>
                              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Bot Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 max-w-md items-center">
                  <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150" />
                    <span className="text-[11px] font-mono text-cyan-400 ml-2">Retrieving LFHP knowledge...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions & Next Question Bar */}
            <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-900 flex items-center justify-between gap-2 overflow-x-auto select-none">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNextSuggestion}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium flex items-center gap-1.5 hover:scale-105 transition-all shadow-sm"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Next Suggestion</span>
                </button>

                <button
                  onClick={handleRandomQuestion}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-mono flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Random Q&A</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
                Total 140+ Linux, Networking & Frontend Questions
              </div>
            </div>

            {/* Input Bar with Voice Recognition */}
            <form
              onSubmit={handleSendText}
              className="p-3 bg-slate-950 border-t border-cyan-500/20 flex items-center gap-2"
            >
              {/* Voice Input Microphone Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={isListening ? 'Listening... click to stop' : 'Voice search / Speak question'}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-cyan-400'
                }`}
              >
                {isListening ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Ask about Linux commands (grep, chmod, find), Networking (nmap, ports, CIDR), or Frontend (React, Closures)..."
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent text-xs font-sans transition-all"
                />
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold transition-all shadow-cyber-glow"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: 100+ CATALOG BROWSER */}
        {activeTab === 'catalog' && (
          <div className="flex-1 flex flex-col h-full bg-[#030712] overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={e => setCatalogSearch(e.target.value)}
                    placeholder="Search across 100+ questions, tags, keywords..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-cyan-500 text-slate-950 font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCatalog.map(qa => (
                <div
                  key={qa.id}
                  onClick={() => handleSelectQA(qa)}
                  className="p-4 rounded-xl bg-slate-950/80 hover:bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                        {qa.category}
                      </span>
                      <span className={`text-[10px] font-mono ${
                        qa.difficulty === 'Beginner' ? 'text-emerald-400' :
                        qa.difficulty === 'Intermediate' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {qa.difficulty}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 line-clamp-2">
                      {qa.question}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5">
                      {qa.shortAnswer}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                    <span>{qa.tags.slice(0, 3).join(', ')}</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Ask AI <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: QUIZ / FLASHCARD MODE */}
        {activeTab === 'quiz' && (
          <div className="flex-1 flex flex-col h-full items-center justify-center p-6 bg-[#030712] overflow-y-auto">
            <div className="w-full max-w-xl bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Quiz Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>LFHP Frontend Flashcard Quiz</span>
                </div>
                <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                  Score: <span className="text-emerald-400 font-bold">{quizScore.correct}</span> / {quizScore.total}
                </div>
              </div>

              {quizQA && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                      {quizQA.category}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">
                      Level: {quizQA.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 font-mono">
                    {quizQA.question}
                  </h3>

                  {showQuizAnswer ? (
                    <div className="space-y-4 p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs leading-relaxed animate-in fade-in">
                      <p className="font-semibold text-emerald-300">{quizQA.shortAnswer}</p>
                      <p className="text-slate-300 whitespace-pre-wrap">{quizQA.detailedAnswer}</p>

                      {quizQA.codeSnippet && (
                        <pre className="p-3 rounded-lg bg-black text-emerald-400 text-[11px] font-mono overflow-x-auto">
                          <code>{quizQA.codeSnippet}</code>
                        </pre>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                        <span className="text-[11px] text-slate-400 font-mono">Did you know this answer?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuizGrade(false)}
                            className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-mono text-xs"
                          >
                            ❌ Need Practice
                          </button>
                          <button
                            onClick={() => handleQuizGrade(true)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs"
                          >
                            ✓ Got It Right!
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 text-center">
                      <button
                        onClick={() => setShowQuizAnswer(true)}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-cyber-glow"
                      >
                        Reveal Answer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
