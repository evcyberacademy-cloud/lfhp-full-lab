'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppId, AppDefinition, WindowInstance } from '@/types/window';
import { UserSettings, DesktopWallpaper, TerminalTheme } from '@/types/settings';
import { SoundEffects } from '@/lib/sounds/sound-effects';

export const APP_DEFINITIONS: Record<AppId, AppDefinition> = {
  'terminal': {
    id: 'terminal',
    name: 'Terminal',
    description: 'Virtual Linux Bash shell and cyber tool suite',
    icon: 'Terminal',
    category: 'System',
    defaultWidth: 780,
    defaultHeight: 480,
    minWidth: 420,
    minHeight: 280,
    isPinnedToDock: true,
    showOnDesktop: true,
  },
  'file-manager': {
    id: 'file-manager',
    name: 'Files',
    description: 'Linux VFS graphical explorer and permissions manager',
    icon: 'Folder',
    category: 'System',
    defaultWidth: 720,
    defaultHeight: 460,
    minWidth: 380,
    minHeight: 260,
    isPinnedToDock: true,
    showOnDesktop: true,
  },
  'lab-center': {
    id: 'lab-center',
    name: 'LFHP Lab Center',
    description: 'Guided interactive hacking curriculum & automated tasks',
    icon: 'Shield',
    category: 'Learning',
    defaultWidth: 840,
    defaultHeight: 540,
    minWidth: 400,
    minHeight: 300,
    isPinnedToDock: true,
    showOnDesktop: true,
  },
  'ai-bot': {
    id: 'ai-bot',
    name: 'LFHP AI Mentor',
    description: '100+ Frontend Q&A, interactive voice mentor & suggestions',
    icon: 'Bot',
    category: 'Learning',
    defaultWidth: 800,
    defaultHeight: 540,
    minWidth: 400,
    minHeight: 320,
    isPinnedToDock: true,
    showOnDesktop: true,
  },
  'text-editor': {
    id: 'text-editor',
    name: 'Text Editor',
    description: 'Graphical code and configuration file editor',
    icon: 'FileCode',
    category: 'Development',
    defaultWidth: 680,
    defaultHeight: 460,
    minWidth: 360,
    minHeight: 240,
    isPinnedToDock: true,
    showOnDesktop: false,
  },
  'browser': {
    id: 'browser',
    name: 'Cyber Browser',
    description: 'Simulated intranet browser for web security recon',
    icon: 'Globe',
    category: 'Security',
    defaultWidth: 800,
    defaultHeight: 500,
    minWidth: 420,
    minHeight: 280,
    isPinnedToDock: true,
    showOnDesktop: true,
  },
  'network-map': {
    id: 'network-map',
    name: 'Network Monitor',
    description: 'Visual subnet topology and target node scanner',
    icon: 'Network',
    category: 'Security',
    defaultWidth: 740,
    defaultHeight: 480,
    minWidth: 380,
    minHeight: 260,
    isPinnedToDock: true,
    showOnDesktop: false,
  },
  'settings': {
    id: 'settings',
    name: 'Settings',
    description: 'Desktop personalization, themes, and sound settings',
    icon: 'Settings',
    category: 'System',
    defaultWidth: 620,
    defaultHeight: 420,
    minWidth: 340,
    minHeight: 240,
    isPinnedToDock: false,
    showOnDesktop: false,
  },
};

interface DesktopContextType {
  windows: WindowInstance[];
  activeWindowId: string | null;
  settings: UserSettings;
  isLauncherOpen: boolean;
  isQuickSettingsOpen: boolean;
  openApp: (appId: AppId, params?: Record<string, any>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  toggleLauncher: () => void;
  setLauncherOpen: (open: boolean) => void;
  toggleQuickSettings: () => void;
  setQuickSettingsOpen: (open: boolean) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  isMobile: boolean;
}

const SETTINGS_STORAGE_KEY = 'evcyber_user_settings_v1';

const defaultSettings: UserSettings = {
  wallpaper: 'cyber-grid',
  terminalTheme: 'cyber-cyan',
  terminalFontSize: 14,
  soundEnabled: true,
  scanlineEffect: false,
  animationsEnabled: true,
  dockPosition: 'bottom',
};

const DesktopContext = createContext<DesktopContextType | undefined>(undefined);

export const DesktopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [highestZ, setHighestZ] = useState(10);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check viewport size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Load saved settings
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
        if (parsed.soundEnabled !== undefined) {
          SoundEffects.setEnabled(parsed.soundEnabled);
        }
      }
    } catch {
      // Ignore
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Open initial apps (Terminal & Lab Center) on first load
  useEffect(() => {
    if (windows.length === 0 && typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      if (screenWidth < 768) {
        // Mobile initial window
        openApp('terminal');
      } else {
        // Desktop side-by-side arrangement: Terminal on left, Lab Center on right
        const termDef = APP_DEFINITIONS['terminal'];
        const labDef = APP_DEFINITIONS['lab-center'];

        const termWidth = Math.min(Math.floor(screenWidth * 0.48), 750);
        const labWidth = Math.min(Math.floor(screenWidth * 0.48), 750);
        const windowHeight = Math.min(screenHeight - 140, 520);

        const termWindow: WindowInstance = {
          id: 'term_init',
          appId: 'terminal',
          title: 'student@evcyber:~ (bash)',
          icon: termDef.icon,
          x: 40,
          y: 60,
          width: termWidth,
          height: windowHeight,
          minWidth: termDef.minWidth,
          minHeight: termDef.minHeight,
          isMinimized: false,
          isMaximized: false,
          zIndex: 11,
        };

        const labWindow: WindowInstance = {
          id: 'lab_init',
          appId: 'lab-center',
          title: 'LFHP Lab Center - EV Cyber Academy',
          icon: labDef.icon,
          x: Math.max(termWidth + 60, screenWidth - labWidth - 40),
          y: 60,
          width: labWidth,
          height: windowHeight,
          minWidth: labDef.minWidth,
          minHeight: labDef.minHeight,
          isMinimized: false,
          isMaximized: false,
          zIndex: 12,
        };

        setWindows([termWindow, labWindow]);
        setActiveWindowId('lab_init');
        setHighestZ(12);
      }
    }
  }, []);

  const openApp = useCallback((appId: AppId, params?: Record<string, any>) => {
    const appDef = APP_DEFINITIONS[appId];
    if (!appDef) return;

    // Check if single instance app already exists (e.g. settings, lab-center)
    const existing = windows.find(w => w.appId === appId);
    if (existing && appId !== 'terminal' && appId !== 'text-editor') {
      // Focus existing window
      if (existing.isMinimized) {
        setWindows(prev => prev.map(w => w.id === existing.id ? { ...w, isMinimized: false } : w));
      }
      focusWindow(existing.id);
      return;
    }

    const nextZ = highestZ + 1;
    setHighestZ(nextZ);

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const width = isMobile ? screenWidth - 20 : Math.min(appDef.defaultWidth, screenWidth - 40);
    const height = isMobile ? screenHeight - 140 : Math.min(appDef.defaultHeight, screenHeight - 120);

    const offset = (windows.length % 6) * 28;
    const x = isMobile ? 10 : Math.max(40, Math.min(screenWidth - width - 40, 80 + offset));
    const y = isMobile ? 50 : Math.max(50, Math.min(screenHeight - height - 80, 60 + offset));

    const newWindow: WindowInstance = {
      id: `${appId}_${Date.now()}`,
      appId,
      title: params?.title || (appId === 'terminal' ? 'student@evcyber:~ (bash)' : appDef.name),
      icon: appDef.icon,
      x,
      y,
      width,
      height,
      minWidth: appDef.minWidth,
      minHeight: appDef.minHeight,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZ,
      initialParams: params,
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(newWindow.id);
    setIsLauncherOpen(false);
  }, [highestZ, isMobile, windows]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      const remaining = windows.filter(w => w.id !== id && !w.isMinimized);
      if (remaining.length > 0) {
        const nextActive = remaining.reduce((prev, curr) => curr.zIndex > prev.zIndex ? curr : prev);
        setActiveWindowId(nextActive.id);
      } else {
        setActiveWindowId(null);
      }
    }
  }, [activeWindowId, windows]);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      const target = prev.find(w => w.id === id);
      if (!target) return prev;

      const nextZ = highestZ + 1;
      setHighestZ(nextZ);
      setActiveWindowId(id);

      return prev.map(w => w.id === id ? { ...w, zIndex: nextZ, isMinimized: false } : w);
    });
  }, [highestZ]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (activeWindowId === id) {
      const remaining = windows.filter(w => w.id !== id && !w.isMinimized);
      if (remaining.length > 0) {
        const nextActive = remaining.reduce((prev, curr) => curr.zIndex > prev.zIndex ? curr : prev);
        setActiveWindowId(nextActive.id);
      } else {
        setActiveWindowId(null);
      }
    }
  }, [activeWindowId, windows]);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
    focusWindow(id);
  }, [focusWindow]);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w));
  }, []);

  const toggleLauncher = () => {
    setIsLauncherOpen(prev => !prev);
    setIsQuickSettingsOpen(false);
  };

  const toggleQuickSettings = () => {
    setIsQuickSettingsOpen(prev => !prev);
    setIsLauncherOpen(false);
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      if (newSettings.soundEnabled !== undefined) {
        SoundEffects.setEnabled(newSettings.soundEnabled);
      }
      return updated;
    });
  };

  return (
    <DesktopContext.Provider
      value={{
        windows,
        activeWindowId,
        settings,
        isLauncherOpen,
        isQuickSettingsOpen,
        openApp,
        closeWindow,
        focusWindow,
        minimizeWindow,
        maximizeWindow,
        updateWindowPosition,
        updateWindowSize,
        toggleLauncher,
        setLauncherOpen: setIsLauncherOpen,
        toggleQuickSettings,
        setQuickSettingsOpen: setIsQuickSettingsOpen,
        updateSettings,
        isMobile,
      }}
    >
      {children}
    </DesktopContext.Provider>
  );
};

export const useDesktop = (): DesktopContextType => {
  const context = useContext(DesktopContext);
  if (!context) {
    throw new Error('useDesktop must be used within a DesktopProvider');
  }
  return context;
};
