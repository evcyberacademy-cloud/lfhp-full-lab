export type TerminalTheme = 'cyber-cyan' | 'matrix-green' | 'monokai' | 'dracula' | 'amber-phosphor' | 'pure-black';

export type DesktopWallpaper = 'cyber-grid' | 'hex-matrix' | 'deep-space' | 'dark-obsidian' | 'blue-circuit';

export interface UserSettings {
  wallpaper: DesktopWallpaper;
  terminalTheme: TerminalTheme;
  terminalFontSize: number;
  soundEnabled: boolean;
  scanlineEffect: boolean;
  animationsEnabled: boolean;
  dockPosition: 'bottom' | 'top' | 'left';
}
