export type AppId = 
  | 'terminal'
  | 'file-manager'
  | 'text-editor'
  | 'lab-center'
  | 'ai-bot'
  | 'browser'
  | 'network-map'
  | 'settings';

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  icon: string; // Lucide icon name or identifier
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  initialParams?: Record<string, any>; // e.g. open specific file or lab
}

export interface AppDefinition {
  id: AppId;
  name: string;
  description: string;
  icon: string;
  category: 'System' | 'Development' | 'Security' | 'Learning';
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  isPinnedToDock: boolean;
  showOnDesktop: boolean;
}
