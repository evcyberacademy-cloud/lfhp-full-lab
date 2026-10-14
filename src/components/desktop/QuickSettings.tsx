'use client';

import React from 'react';
import { useDesktop } from '@/context/DesktopContext';
import { useVFS } from '@/context/VFSContext';
import { useLab } from '@/context/LabContext';
import { DesktopWallpaper, TerminalTheme } from '@/types/settings';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RefreshCw, 
  Monitor, 
  Terminal, 
  Sliders, 
  X,
  Palette
} from 'lucide-react';

export const QuickSettings: React.FC = () => {
  const { 
    isQuickSettingsOpen, 
    setQuickSettingsOpen, 
    settings, 
    updateSettings 
  } = useDesktop();
  const { resetVFS } = useVFS();
  const { resetAllProgress } = useLab();

  if (!isQuickSettingsOpen) return null;

  const wallpapers: { id: DesktopWallpaper; label: string }[] = [
    { id: 'cyber-grid', label: 'Cyber Grid (Default)' },
    { id: 'hex-matrix', label: 'Hex Matrix' },
    { id: 'deep-space', label: 'Deep Space' },
    { id: 'dark-obsidian', label: 'Dark Obsidian' },
    { id: 'blue-circuit', label: 'Blue Circuit' },
  ];

  const terminalThemes: { id: TerminalTheme; label: string; color: string }[] = [
    { id: 'cyber-cyan', label: 'Cyber Cyan', color: '#00f0ff' },
    { id: 'matrix-green', label: 'Matrix Green', color: '#10b981' },
    { id: 'monokai', label: 'Monokai', color: '#f59e0b' },
    { id: 'dracula', label: 'Dracula Purple', color: '#a855f7' },
    { id: 'amber-phosphor', label: 'Amber CRT', color: '#fbbf24' },
  ];

  const handleResetEnvironment = async () => {
    if (window.confirm('Reset Virtual Linux Filesystem and LFHP Lab Progress to initial state?')) {
      await resetVFS();
      resetAllProgress();
      setQuickSettingsOpen(false);
    }
  };

  return (
    <div 
      onClick={() => setQuickSettingsOpen(false)}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="w-80 h-full bg-slate-950/95 border-l border-cyan-500/20 shadow-2xl p-5 overflow-y-auto text-slate-200 animate-in slide-in-from-right duration-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <Sliders className="w-4 h-4" />
            <span>Desktop Settings</span>
          </div>
          <button 
            onClick={() => setQuickSettingsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Toggle */}
        <div className="my-5">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Audio</h4>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
              settings.soundEnabled 
                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-xs font-medium">Terminal & Lab Sound Effects</span>
            </div>
            <span className="text-[11px] font-mono">{settings.soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* CRT Scanline Toggle */}
        <div className="my-5">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Effects</h4>
          <button
            onClick={() => updateSettings({ scanlineEffect: !settings.scanlineEffect })}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
              settings.scanlineEffect 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">CRT Scanline Shader</span>
            </div>
            <span className="text-[11px] font-mono">{settings.scanlineEffect ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Wallpaper Picker */}
        <div className="my-5">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cyber Wallpaper</h4>
          <div className="space-y-1.5">
            {wallpapers.map(wp => (
              <button
                key={wp.id}
                onClick={() => updateSettings({ wallpaper: wp.id })}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  settings.wallpaper === wp.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                }`}
              >
                {wp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Themes */}
        <div className="my-5">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Terminal Theme</h4>
          <div className="space-y-1.5">
            {terminalThemes.map(th => (
              <button
                key={th.id}
                onClick={() => updateSettings({ terminalTheme: th.id })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  settings.terminalTheme === th.id
                    ? 'bg-slate-800 text-slate-100 border border-cyan-500/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                }`}
              >
                <span>{th.label}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: th.color }} />
              </button>
            ))}
          </div>
        </div>

        {/* System Reset */}
        <div className="mt-8 pt-4 border-t border-slate-800">
          <button
            onClick={handleResetEnvironment}
            className="w-full py-2.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filesystem & Labs</span>
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-1.5">
            Clears virtual files and resets all LFHP tasks to 0%.
          </p>
        </div>
      </div>
    </div>
  );
};
