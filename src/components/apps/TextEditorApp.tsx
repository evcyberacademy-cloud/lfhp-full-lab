'use client';

import React, { useState, useEffect } from 'react';
import { useVFS } from '@/context/VFSContext';
import { useLab } from '@/context/LabContext';
import { SoundEffects } from '@/lib/sounds/sound-effects';
import { Save, FileCode, Check, RefreshCw } from 'lucide-react';

interface TextEditorProps {
  initialFilePath?: string;
}

export const TextEditorApp: React.FC<TextEditorProps> = ({ initialFilePath }) => {
  const { readFile, writeFile, vfsState } = useVFS();
  const { validateCurrentTask } = useLab();

  const [filePath, setFilePath] = useState<string>(initialFilePath || '/home/student/notes.txt');
  const [content, setContent] = useState<string>('');
  const [isModified, setIsModified] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');

  useEffect(() => {
    if (filePath) {
      const res = readFile(filePath);
      if (res.success && res.data !== undefined) {
        setContent(res.data);
        setIsModified(false);
        setStatusMessage(`Opened ${filePath}`);
      }
    }
  }, [filePath, readFile]);

  const handleSave = () => {
    if (!filePath.trim()) return;
    const res = writeFile(filePath.trim(), content);
    if (res.success) {
      setIsModified(false);
      setStatusMessage('File saved successfully');
      SoundEffects.playTaskSuccess();
      validateCurrentTask();
    } else {
      setStatusMessage(`Error: ${res.error}`);
      SoundEffects.playError();
    }
  };

  const lines = content.split('\n');

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-mono select-none">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={filePath}
            onChange={e => {
              setFilePath(e.target.value);
              setIsModified(true);
            }}
            placeholder="/home/student/notes.txt"
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono w-64 focus:outline-none focus:border-cyan-500"
          />
          {isModified && (
            <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Editor Text Area with Line Numbers */}
      <div className="flex-1 flex overflow-hidden bg-[#0a0d14]">
        {/* Line Numbers */}
        <div className="w-10 bg-slate-950/80 border-r border-slate-800/80 py-3 text-right pr-2 text-xs text-slate-600 font-mono select-none leading-relaxed">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={content}
          onChange={e => {
            setContent(e.target.value);
            setIsModified(true);
          }}
          onKeyDown={e => {
            if (e.ctrlKey && e.key === 's') {
              e.preventDefault();
              handleSave();
            }
          }}
          className="flex-1 p-3 bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none select-text overflow-auto"
          placeholder="Start typing virtual file contents..."
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>{statusMessage}</span>
        <span>Lines: {lines.length} | Chars: {content.length}</span>
      </div>
    </div>
  );
};
