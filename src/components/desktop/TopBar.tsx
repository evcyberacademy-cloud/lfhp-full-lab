'use client';

import React, { useState, useEffect } from 'react';
import { useDesktop } from '@/context/DesktopContext';
import { useAuth } from '@/context/AuthContext';
import { useLab } from '@/context/LabContext';
import { 
  Shield, 
  Terminal, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Sliders, 
  LogOut, 
  Sparkles,
  Layers,
  ChevronDown,
  Bot
} from 'lucide-react';
import { SpeechService } from '@/lib/speech/speech-service';

export const TopBar: React.FC = () => {
  const { 
    windows, 
    activeWindowId, 
    toggleLauncher, 
    toggleQuickSettings, 
    openApp,
    settings, 
    updateSettings 
  } = useDesktop();
  const { authState, logout } = useAuth();
  const { percentComplete, completedTasksCount, totalTasksCount } = useLab();
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeWindow = windows.find(w => w.id === activeWindowId);

  return (
    <header className="fixed top-0 left-0 right-0 h-9 bg-slate-950/90 backdrop-blur-md border-b border-cyan-500/20 text-slate-200 z-50 flex items-center justify-between px-3 text-xs select-none shadow-sm">
      {/* Left section: EV Brand & Activities & AI Mentor */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLauncher}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 font-semibold tracking-wide transition-all shadow-sm group"
        >
          <img 
            src="/company-logo.jpg" 
            alt="EV Cyber Academy Logo" 
            className="w-5 h-5 object-contain rounded-md group-hover:scale-110 transition-transform drop-shadow-[0_0_4px_rgba(0,240,255,0.7)]" 
          />
          <span className="font-mono font-bold text-slate-100">EV CYBER-LABS</span>
        </button>

        <button
          onClick={toggleLauncher}
          className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors hidden sm:inline-flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Applications</span>
        </button>

        {/* AI Mentor Quick Launch Button */}
        <button
          onClick={() => openApp('ai-bot')}
          className="px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 transition-all flex items-center gap-1.5 shadow-sm group"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400 animate-pulse group-hover:scale-110 transition-transform" />
          <span className="font-mono font-medium hidden md:inline">AI Mentor (100+ Q&A)</span>
          <span className="font-mono font-medium md:hidden">AI Mentor</span>
        </button>

        {activeWindow && (
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-slate-400 font-mono text-[11px] truncate max-w-xs">
            <span className="text-cyan-400">active:</span>
            <span className="truncate text-slate-200">{activeWindow.title}</span>
          </div>
        )}
      </div>

      {/* Center: Live Clock & Date */}
      <div className="flex items-center gap-2 font-mono font-medium text-slate-300">
        <span className="text-slate-400 hidden sm:inline">{date}</span>
        <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800/80 text-cyan-300 font-bold tracking-wider">
          {time}
        </span>
      </div>

      {/* Right: Lab Progress, Student Name, Audio, Tray */}
      <div className="flex items-center gap-2">
        {/* Lab Progress Pill */}
        <div 
          title={`LFHP Progress: ${completedTasksCount}/${totalTasksCount} tasks (${percentComplete}%)`}
          className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]"
        >
          <Shield className="w-3 h-3 text-emerald-400" />
          <span>LFHP {percentComplete}%</span>
        </div>

        {/* Network status */}
        <div 
          title="Virtual Interface: eth0 (10.10.10.100)"
          className="hidden lg:flex items-center gap-1 text-slate-400 hover:text-slate-200 font-mono text-[11px]"
        >
          <Wifi className="w-3 h-3 text-cyan-400" />
          <span>10.10.10.100</span>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          title={settings.soundEnabled ? "Mute sounds" : "Enable sounds"}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {/* Quick Settings gear */}
        <button
          onClick={toggleQuickSettings}
          title="Quick Settings"
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Student Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(prev => !prev)}
            className="flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200 border border-slate-800/80 transition-colors"
          >
            <span className="font-medium text-cyan-300 truncate max-w-[120px]">
              {authState.student ? `Welcome, ${authState.student.studentName}` : 'Student'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <div 
              onClick={() => setShowUserMenu(false)}
              className="absolute right-0 mt-1 w-48 rounded-lg bg-slate-900 border border-slate-800 shadow-xl py-1 text-slate-300 z-50 animate-in fade-in zoom-in-95"
            >
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="font-semibold text-white text-xs">{authState.student?.studentName}</p>
                <p className="font-mono text-[10px] text-cyan-400">student@evcyber</p>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">LFHP Access: Active</p>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  SpeechService.speakWelcome(authState.student?.studentName || 'Student');
                }}
                className="w-full text-left px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10 flex items-center gap-2 transition-colors border-b border-slate-800"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Play Welcome Voice</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  openApp('ai-bot');
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors border-b border-slate-800"
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open AI Mentor</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
