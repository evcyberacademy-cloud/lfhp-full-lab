'use client';

import React from 'react';
import { useDesktop, APP_DEFINITIONS } from '@/context/DesktopContext';
import { AppId } from '@/types/window';
import { 
  Terminal, 
  Folder, 
  Shield, 
  FileCode, 
  Globe, 
  Network, 
  Settings,
  Bot,
  Sparkles
} from 'lucide-react';

const DOCK_ICONS: Record<AppId, React.ReactNode> = {
  'terminal': <Terminal className="w-6 h-6 text-cyan-400" />,
  'lab-center': <img src="/lfhp-logo.png" alt="LFHP Labs" className="w-6 h-6 object-contain drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]" />,
  'ai-bot': <Bot className="w-6 h-6 text-cyan-300 animate-pulse" />,
  'file-manager': <Folder className="w-6 h-6 text-amber-400" />,
  'text-editor': <FileCode className="w-6 h-6 text-purple-400" />,
  'browser': <Globe className="w-6 h-6 text-blue-400" />,
  'network-map': <Network className="w-6 h-6 text-rose-400" />,
  'settings': <Settings className="w-6 h-6 text-slate-400" />,
};

export const Dock: React.FC = () => {
  const { windows, activeWindowId, openApp, focusWindow, isMobile } = useDesktop();

  const dockApps: AppId[] = [
    'terminal',
    'lab-center',
    'ai-bot',
    'file-manager',
    'browser',
    'text-editor',
    'network-map',
    'settings',
  ];

  const handleAppClick = (appId: AppId) => {
    const matchingWindows = windows.filter(w => w.appId === appId);

    if (matchingWindows.length === 0) {
      openApp(appId);
    } else {
      // If currently active, toggle minimize/restore
      const active = matchingWindows.find(w => w.id === activeWindowId);
      if (active) {
        // bring next or focus
        focusWindow(active.id);
      } else {
        focusWindow(matchingWindows[0].id);
      }
    }
  };

  return (
    <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-cyan-500/20 shadow-2xl">
        {dockApps.map((appId) => {
          const appDef = APP_DEFINITIONS[appId];
          const isRunning = windows.some(w => w.appId === appId);
          const isActive = windows.some(w => w.appId === appId && w.id === activeWindowId);

          return (
            <div key={appId} className="relative group">
              <button
                onClick={() => handleAppClick(appId)}
                aria-label={appDef.name}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive 
                    ? 'bg-slate-800/90 ring-1 ring-cyan-400 scale-105 shadow-cyber-glow' 
                    : isRunning
                    ? 'bg-slate-900/80 hover:bg-slate-800 hover:scale-110'
                    : 'hover:bg-slate-900/60 hover:scale-105 opacity-80 hover:opacity-100'
                }`}
              >
                {DOCK_ICONS[appId]}
              </button>

              {/* Running Indicator Dot */}
              {isRunning && (
                <div 
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-cyan-400 ring-2 ring-cyan-400/40' : 'bg-slate-400'
                  }`} 
                />
              )}

              {/* Desktop Tooltip */}
              {!isMobile && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg">
                  {appDef.name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};
