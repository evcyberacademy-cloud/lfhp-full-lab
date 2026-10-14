'use client';

import React, { useState } from 'react';
import { useDesktop, APP_DEFINITIONS } from '@/context/DesktopContext';
import { AppId } from '@/types/window';
import { 
  Search, 
  Terminal, 
  Folder, 
  Shield, 
  FileCode, 
  Globe, 
  Network, 
  Settings,
  Bot,
  X 
} from 'lucide-react';

const APP_ICONS: Record<AppId, React.ReactNode> = {
  'terminal': <Terminal className="w-8 h-8 text-cyan-400" />,
  'lab-center': <img src="/lfhp-logo.png" alt="LFHP Lab Center" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]" />,
  'ai-bot': <Bot className="w-8 h-8 text-cyan-300 animate-pulse" />,
  'file-manager': <Folder className="w-8 h-8 text-amber-400" />,
  'text-editor': <FileCode className="w-8 h-8 text-purple-400" />,
  'browser': <Globe className="w-8 h-8 text-blue-400" />,
  'network-map': <Network className="w-8 h-8 text-rose-400" />,
  'settings': <Settings className="w-8 h-8 text-slate-400" />,
};

export const AppLauncher: React.FC = () => {
  const { isLauncherOpen, setLauncherOpen, openApp } = useDesktop();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isLauncherOpen) return null;

  const categories = ['All', 'System', 'Security', 'Learning', 'Development'];

  const allApps = Object.values(APP_DEFINITIONS);
  const filteredApps = allApps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div 
      onClick={() => setLauncherOpen(false)}
      className="fixed inset-0 top-9 bg-slate-950/80 backdrop-blur-xl z-50 flex flex-col items-center p-6 animate-in fade-in duration-150"
    >
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-2xl flex flex-col items-center"
      >
        {/* Search Bar */}
        <div className="w-full relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search applications, cyber tools, labs..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 shadow-cyber-glow"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto w-full justify-center pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
          {filteredApps.map(app => (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all hover:scale-105 group text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center mb-3 group-hover:shadow-cyber-glow transition-shadow">
                {APP_ICONS[app.id]}
              </div>
              <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300">
                {app.name}
              </span>
              <span className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                {app.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
