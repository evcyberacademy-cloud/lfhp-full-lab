'use client';

import React from 'react';
import { useDesktop, APP_DEFINITIONS } from '@/context/DesktopContext';
import { AppId } from '@/types/window';
import { 
  Terminal, 
  Folder, 
  Shield, 
  Globe, 
  FileText,
  Bot 
} from 'lucide-react';

interface DesktopIconProps {
  appId?: AppId;
  filePath?: string;
  title: string;
  iconType: 'terminal' | 'file-manager' | 'lab-center' | 'ai-bot' | 'browser' | 'file';
  x?: number;
  y?: number;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  appId,
  filePath,
  title,
  iconType,
}) => {
  const { openApp } = useDesktop();

  const handleDoubleClick = () => {
    if (appId) {
      openApp(appId);
    } else if (filePath) {
      openApp('text-editor', { filePath, title });
    }
  };

  const renderIcon = () => {
    switch (iconType) {
      case 'terminal':
        return <Terminal className="w-9 h-9 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" />;
      case 'lab-center':
        return <img src="/lfhp-logo.png" alt="LFHP Labs" className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]" />;
      case 'ai-bot':
        return <Bot className="w-9 h-9 text-cyan-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.6)] animate-pulse" />;
      case 'file-manager':
        return <Folder className="w-9 h-9 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />;
      case 'browser':
        return <Globe className="w-9 h-9 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" />;
      case 'file':
        return <FileText className="w-9 h-9 text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />;
    }
  };

  return (
    <button
      onDoubleClick={handleDoubleClick}
      onTouchEnd={handleDoubleClick}
      className="w-20 flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-900/60 focus:bg-slate-900/80 focus:ring-1 focus:ring-cyan-400/50 transition-all select-none group"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-500/40 transition-all shadow-md">
        {renderIcon()}
      </div>
      <span className="text-[11px] font-medium text-slate-200 text-center line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] px-1 group-hover:text-cyan-300">
        {title}
      </span>
    </button>
  );
};
