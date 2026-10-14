'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WindowInstance } from '@/types/window';
import { useDesktop } from '@/context/DesktopContext';
import { 
  Terminal, 
  Folder, 
  Shield, 
  FileCode, 
  Globe, 
  Network, 
  Settings, 
  Minus, 
  Square, 
  X, 
  Copy 
} from 'lucide-react';

interface WindowProps {
  window: WindowInstance;
  children: React.ReactNode;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Terminal: <Terminal className="w-4 h-4 text-cyan-400" />,
  Folder: <Folder className="w-4 h-4 text-amber-400" />,
  Shield: <img src="/lfhp-logo.png" alt="LFHP Labs" className="w-4 h-4 object-contain" />,
  FileCode: <FileCode className="w-4 h-4 text-purple-400" />,
  Globe: <Globe className="w-4 h-4 text-blue-400" />,
  Network: <Network className="w-4 h-4 text-rose-400" />,
  Settings: <Settings className="w-4 h-4 text-slate-400" />,
};

export const Window: React.FC<WindowProps> = ({ window: win, children }) => {
  const { 
    activeWindowId, 
    focusWindow, 
    closeWindow, 
    minimizeWindow, 
    maximizeWindow, 
    updateWindowPosition, 
    updateWindowSize,
    isMobile 
  } = useDesktop();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; winX: number; winY: number; winW: number; winH: number }>({
    mouseX: 0,
    mouseY: 0,
    winX: 0,
    winY: 0,
    winW: 0,
    winH: 0,
  });

  const isActive = activeWindowId === win.id;

  // Handle Dragging
  const handleMouseDownHeader = (e: React.MouseEvent | React.TouchEvent) => {
    if (win.isMaximized || isMobile) return;
    focusWindow(win.id);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      winX: win.x,
      winY: win.y,
      winW: win.width,
      winH: win.height,
    };
    setIsDragging(true);
  };

  // Handle Resizing
  const handleMouseDownResize = (e: React.MouseEvent | React.TouchEvent, direction: string) => {
    e.stopPropagation();
    if (win.isMaximized || isMobile) return;
    focusWindow(win.id);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      winX: win.x,
      winY: win.y,
      winW: win.width,
      winH: win.height,
    };
    setResizeDirection(direction);
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const deltaX = clientX - dragStartRef.current.mouseX;
        const deltaY = clientY - dragStartRef.current.mouseY;
        const newX = Math.max(0, Math.min(window.innerWidth - 100, dragStartRef.current.winX + deltaX));
        const newY = Math.max(36, Math.min(window.innerHeight - 80, dragStartRef.current.winY + deltaY));
        updateWindowPosition(win.id, newX, newY);
      }

      if (isResizing) {
        const deltaX = clientX - dragStartRef.current.mouseX;
        const deltaY = clientY - dragStartRef.current.mouseY;

        let newW = dragStartRef.current.winW;
        let newH = dragStartRef.current.winH;
        let newX = dragStartRef.current.winX;
        let newY = dragStartRef.current.winY;

        if (resizeDirection.includes('e')) {
          newW = Math.max(win.minWidth, dragStartRef.current.winW + deltaX);
        }
        if (resizeDirection.includes('s')) {
          newH = Math.max(win.minHeight, dragStartRef.current.winH + deltaY);
        }
        if (resizeDirection.includes('w')) {
          const possibleW = dragStartRef.current.winW - deltaX;
          if (possibleW >= win.minWidth) {
            newW = possibleW;
            newX = dragStartRef.current.winX + deltaX;
          }
        }
        if (resizeDirection.includes('n')) {
          const possibleH = dragStartRef.current.winH - deltaY;
          if (possibleH >= win.minHeight) {
            newH = possibleH;
            newY = dragStartRef.current.winY + deltaY;
          }
        }

        updateWindowSize(win.id, newW, newH);
        if (newX !== win.x || newY !== win.y) {
          updateWindowPosition(win.id, newX, newY);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDirection, updateWindowPosition, updateWindowSize, win.id, win.minHeight, win.minWidth, win.width, win.x, win.y]);

  if (win.isMinimized) return null;

  const style: React.CSSProperties = win.isMaximized || isMobile
    ? {
        position: 'fixed',
        top: '36px',
        left: 0,
        right: 0,
        bottom: isMobile ? '64px' : '52px',
        width: '100%',
        height: 'calc(100% - 90px)',
        zIndex: win.zIndex,
      }
    : {
        position: 'absolute',
        top: `${win.y}px`,
        left: `${win.x}px`,
        width: `${win.width}px`,
        height: `${win.height}px`,
        zIndex: win.zIndex,
      };

  return (
    <div
      style={style}
      onClick={() => focusWindow(win.id)}
      className={`flex flex-col rounded-lg overflow-hidden transition-shadow backdrop-blur-md ${
        isActive 
          ? 'ring-1 ring-cyan-500/40 shadow-window-active' 
          : 'ring-1 ring-slate-800 shadow-window opacity-95'
      }`}
    >
      {/* Window Header / Title Bar */}
      <div
        onMouseDown={handleMouseDownHeader}
        onTouchStart={handleMouseDownHeader}
        onDoubleClick={() => !isMobile && maximizeWindow(win.id)}
        className={`flex items-center justify-between px-3 py-2 select-none cursor-move border-b ${
          isActive 
            ? 'bg-slate-900/95 border-cyan-500/20 text-slate-200' 
            : 'bg-slate-950/90 border-slate-800/80 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
          {ICON_MAP[win.icon] || <Terminal className="w-4 h-4 text-cyan-400" />}
          <span className="text-xs font-medium font-mono truncate">{win.title}</span>
        </div>

        {/* Window Action Buttons */}
        <div className="flex items-center gap-1.5 ml-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => minimizeWindow(win.id)}
            title="Minimize"
            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          {!isMobile && (
            <button
              onClick={() => maximizeWindow(win.id)}
              title={win.isMaximized ? "Restore" : "Maximize"}
              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              {win.isMaximized ? <Copy className="w-2.5 h-2.5" /> : <Square className="w-2.5 h-2.5" />}
            </button>
          )}
          <button
            onClick={() => closeWindow(win.id)}
            title="Close"
            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Window Content Body */}
      <div className="flex-1 overflow-hidden relative bg-slate-950/90">
        {children}
      </div>

      {/* Resize handles (desktop only and when not maximized) */}
      {!win.isMaximized && !isMobile && (
        <>
          <div onMouseDown={(e) => handleMouseDownResize(e, 'e')} className="absolute top-0 right-0 w-2 h-full cursor-e-resize" />
          <div onMouseDown={(e) => handleMouseDownResize(e, 's')} className="absolute bottom-0 left-0 w-full h-2 cursor-s-resize" />
          <div onMouseDown={(e) => handleMouseDownResize(e, 'se')} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" />
          <div onMouseDown={(e) => handleMouseDownResize(e, 'w')} className="absolute top-0 left-0 w-2 h-full cursor-w-resize" />
          <div onMouseDown={(e) => handleMouseDownResize(e, 'sw')} className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize" />
        </>
      )}
    </div>
  );
};
