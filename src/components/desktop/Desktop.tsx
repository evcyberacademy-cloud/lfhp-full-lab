'use client';

import React, { useState, useEffect } from 'react';
import { useDesktop } from '@/context/DesktopContext';
import { useAuth } from '@/context/AuthContext';
import { Window } from './Window';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { AppLauncher } from './AppLauncher';
import { ContextMenu } from './ContextMenu';
import { NotificationCenter } from './NotificationCenter';
import { QuickSettings } from './QuickSettings';
import { DesktopIcon } from './DesktopIcon';

import { TerminalApp } from '../apps/TerminalApp';
import { FileManagerApp } from '../apps/FileManagerApp';
import { TextEditorApp } from '../apps/TextEditorApp';
import { LabCenterApp } from '../apps/LabCenterApp';
import { AIBotApp } from '../apps/AIBotApp';
import { BrowserApp } from '../apps/BrowserApp';
import { NetworkMapApp } from '../apps/NetworkMapApp';
import { SettingsApp } from '../apps/SettingsApp';
import { SpeechService } from '@/lib/speech/speech-service';
import { OSCrashOverlay } from './OSCrashOverlay';
import { Bot, Volume2, Sparkles, X } from 'lucide-react';

export const Desktop: React.FC = () => {
  const { windows, settings, openApp } = useDesktop();
  const { authState } = useAuth();
  const studentName = authState.student?.studentName || 'Student';

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);

  // Trigger Welcome Voice Announcement upon student entry: "Welcome <name> to LFHP labs"
  useEffect(() => {
    SpeechService.init();

    // Small delay to ensure browser speech engine is ready after user interaction
    const timer = setTimeout(() => {
      SpeechService.speakWelcome(studentName);
    }, 400);

    // Auto-dismiss welcome toast after 8 seconds
    const bannerTimer = setTimeout(() => {
      setShowWelcomeBanner(false);
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(bannerTimer);
    };
  }, [studentName]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const getWallpaperBackground = () => {
    switch (settings.wallpaper) {
      case 'hex-matrix':
        return 'bg-[#030712] [background-image:radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]';
      case 'deep-space':
        return 'bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#020617]';
      case 'dark-obsidian':
        return 'bg-[#030712]';
      case 'blue-circuit':
        return 'bg-[#020914] [background-image:linear-gradient(to_right,#0f243a_1px,transparent_1px),linear-gradient(to_bottom,#0f243a_1px,transparent_1px)] [background-size:32px_32px]';
      case 'cyber-grid':
      default:
        return 'bg-[#040812] [background-image:linear-gradient(to_right,#132238_1px,transparent_1px),linear-gradient(to_bottom,#132238_1px,transparent_1px)] [background-size:40px_40px]';
    }
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={closeContextMenu}
      className={`fixed inset-0 w-screen h-screen overflow-hidden select-none ${getWallpaperBackground()}`}
    >
      {/* Scanline CRT Shader Effect if enabled */}
      {settings.scanlineEffect && (
        <div className="absolute inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
      )}

      {/* Subtle Cyan Center Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Desktop Background Academy Logo Watermark (Medium Size) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none select-none z-0 opacity-30">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-slate-950/60 border border-cyan-500/40 p-3 flex items-center justify-center mb-3 shadow-[0_0_35px_rgba(0,240,255,0.25)]">
          <img 
            src="/lfhp-logo.png" 
            alt="LFHP Course Logo" 
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_16px_rgba(0,240,255,0.7)]" 
          />
        </div>
        <h1 className="text-lg sm:text-xl font-black font-mono tracking-widest text-cyan-400 uppercase drop-shadow-md text-center">
          LFHP CYBER-LABS
        </h1>
        <p className="text-[11px] font-mono text-slate-400 tracking-wider mt-0.5 text-center">
          LEARN FUNDAMENTALS OF HACKING PROGRAM • EV CYBER ACADEMY
        </p>
      </div>

      {/* Top Bar Navigation */}
      <TopBar />

      {/* Welcome Voice Announcement Toast */}
      {showWelcomeBanner && (
        <div className="fixed top-12 right-4 z-40 max-w-sm w-full bg-slate-950/95 border border-cyan-500/40 rounded-2xl p-4 shadow-cyber-glow backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-500/50 p-1 flex items-center justify-center flex-shrink-0 shadow-cyber-glow">
              <img 
                src="/company-logo.jpg" 
                alt="EV Cyber Academy Logo" 
                className="w-9 h-9 object-contain rounded-lg" 
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> LFHP Audio Voice Engine
                </span>
                <button
                  onClick={() => setShowWelcomeBanner(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="text-xs font-bold text-slate-100 mt-0.5">
                Welcome, {studentName}!
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-snug font-sans">
                "Welcome {studentName} to LFHP labs" voice announced. LFHP AI Mentor & 100+ Frontend questions are active.
              </p>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => SpeechService.speakWelcome(studentName)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-3 h-3 text-cyan-400" />
                  <span>Replay Voice</span>
                </button>

                <button
                  onClick={() => {
                    setShowWelcomeBanner(false);
                    openApp('ai-bot');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-bold font-sans flex items-center gap-1 transition-colors"
                >
                  <Bot className="w-3 h-3" />
                  <span>Open AI Mentor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Workspace & Shortcuts */}
      <div className="pt-12 pb-16 px-4 h-full relative overflow-hidden flex flex-col flex-wrap gap-4 items-start content-start">
        <DesktopIcon
          appId="terminal"
          title="Terminal"
          iconType="terminal"
        />
        <DesktopIcon
          appId="lab-center"
          title="LFHP Labs"
          iconType="lab-center"
        />
        <DesktopIcon
          appId="ai-bot"
          title="AI Mentor"
          iconType="ai-bot"
        />
        <DesktopIcon
          appId="file-manager"
          title="Files"
          iconType="file-manager"
        />
        <DesktopIcon
          appId="browser"
          title="Browser"
          iconType="browser"
        />
        <DesktopIcon
          filePath="/home/student/Desktop/WELCOME_STUDENT.txt"
          title="WELCOME.txt"
          iconType="file"
        />
      </div>

      {/* Windows Layer */}
      {windows.map((win) => {
        let AppContent = null;
        switch (win.appId) {
          case 'terminal':
            AppContent = <TerminalApp />;
            break;
          case 'file-manager':
            AppContent = <FileManagerApp />;
            break;
          case 'text-editor':
            AppContent = <TextEditorApp initialFilePath={win.initialParams?.filePath} />;
            break;
          case 'lab-center':
            AppContent = <LabCenterApp />;
            break;
          case 'ai-bot':
            AppContent = <AIBotApp />;
            break;
          case 'browser':
            AppContent = <BrowserApp />;
            break;
          case 'network-map':
            AppContent = <NetworkMapApp />;
            break;
          case 'settings':
            AppContent = <SettingsApp />;
            break;
          default:
            AppContent = <div className="p-4 text-xs font-mono">App not found</div>;
        }

        return (
          <Window key={win.id} window={win}>
            {AppContent}
          </Window>
        );
      })}

      {/* Floating Bottom Dock */}
      <Dock />

      {/* Full App Launcher Overlay */}
      <AppLauncher />

      {/* Side Quick Settings Drawer */}
      <QuickSettings />

      {/* Simulated OS Crash / Kernel Panic Screen */}
      <OSCrashOverlay />

      {/* Notification Center */}
      <NotificationCenter />

      {/* Right Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};
