'use client';

import React from 'react';
import { useDesktop } from '@/context/DesktopContext';
import { Terminal, Folder, Shield, RefreshCw, Sliders, Globe } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const { openApp, toggleQuickSettings } = useDesktop();

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{ top: `${y}px`, left: `${x}px` }}
      className="fixed z-50 w-52 rounded-lg bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 shadow-2xl py-1 text-xs text-slate-200 animate-in fade-in zoom-in-95"
    >
      <button
        onClick={() => handleAction(() => openApp('terminal'))}
        className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
      >
        <Terminal className="w-4 h-4 text-cyan-400" />
        <span>Open Terminal Here</span>
      </button>

      <button
        onClick={() => handleAction(() => openApp('lab-center'))}
        className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
      >
        <Shield className="w-4 h-4 text-emerald-400" />
        <span>Launch LFHP Lab Center</span>
      </button>

      <button
        onClick={() => handleAction(() => openApp('file-manager'))}
        className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
      >
        <Folder className="w-4 h-4 text-amber-400" />
        <span>Open File Manager</span>
      </button>

      <button
        onClick={() => handleAction(() => openApp('browser'))}
        className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
      >
        <Globe className="w-4 h-4 text-blue-400" />
        <span>Open Cyber Browser</span>
      </button>

      <div className="h-px bg-slate-800 my-1" />

      <button
        onClick={() => handleAction(toggleQuickSettings)}
        className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
      >
        <Sliders className="w-4 h-4 text-purple-400" />
        <span>Change Wallpaper / Themes</span>
      </button>
    </div>
  );
};
