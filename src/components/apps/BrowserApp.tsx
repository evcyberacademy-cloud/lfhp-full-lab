'use client';

import React, { useState } from 'react';
import { HttpSimulator } from '@/lib/network/http-simulator';
import { HttpResponseMock } from '@/types/network';
import { 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Lock, 
  Search, 
  Code, 
  FileText,
  Bookmark
} from 'lucide-react';

export const BrowserApp: React.FC = () => {
  const [urlInput, setUrlInput] = useState<string>('http://bank.local');
  const [currentUrl, setCurrentUrl] = useState<string>('http://bank.local');
  const [response, setResponse] = useState<HttpResponseMock>(HttpSimulator.request('http://bank.local'));
  const [viewMode, setViewMode] = useState<'rendered' | 'source' | 'headers'>('rendered');
  const [history, setHistory] = useState<string[]>(['http://bank.local']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const navigateTo = (url: string) => {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    setUrlInput(clean);
    setCurrentUrl(clean);
    const resp = HttpSimulator.request(clean);
    setResponse(resp);

    setHistory(prev => [...prev.slice(0, historyIndex + 1), clean]);
    setHistoryIndex(prev => prev + 1);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(urlInput);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevUrl = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setUrlInput(prevUrl);
      setCurrentUrl(prevUrl);
      setResponse(HttpSimulator.request(prevUrl));
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextUrl = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setUrlInput(nextUrl);
      setCurrentUrl(nextUrl);
      setResponse(HttpSimulator.request(nextUrl));
    }
  };

  const handleRefresh = () => {
    setResponse(HttpSimulator.request(currentUrl));
  };

  const bookmarks = [
    { label: 'Bank Portal', url: 'http://bank.local' },
    { label: 'Robots.txt', url: 'http://bank.local/robots.txt' },
    { label: 'Admin Console', url: 'http://bank.local/admin' },
    { label: 'Web Target', url: 'http://10.10.10.10' },
    { label: 'Database UI', url: 'http://10.10.10.20:8080' },
    { label: 'EV Academy', url: 'http://evcyber.academy' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* Navigation Toolbar */}
      <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            disabled={historyIndex === 0}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* URL Bar */}
        <form onSubmit={handleFormSubmit} className="flex-1 relative">
          <div className="flex items-center pl-3 pr-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono">
            <Lock className="w-3 h-3 text-emerald-400 mr-2 shrink-0" />
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="Enter URL e.g. http://bank.local"
              className="flex-1 bg-transparent focus:outline-none border-none p-0 text-xs"
            />
          </div>
        </form>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('rendered')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === 'rendered' ? 'bg-cyan-600 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            Rendered
          </button>
          <button
            onClick={() => setViewMode('source')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === 'source' ? 'bg-cyan-600 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            Source
          </button>
          <button
            onClick={() => setViewMode('headers')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === 'headers' ? 'bg-cyan-600 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            Headers
          </button>
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="px-3 py-1 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
        <Bookmark className="w-3 h-3 text-slate-500 shrink-0" />
        {bookmarks.map((bm) => (
          <button
            key={bm.url}
            onClick={() => navigateTo(bm.url)}
            className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 font-mono shrink-0 truncate transition-colors"
          >
            {bm.label}
          </button>
        ))}
      </div>

      {/* Browser View Area */}
      <div className="flex-1 overflow-auto bg-[#080c14] select-text">
        {viewMode === 'rendered' ? (
          <div 
            dangerouslySetInnerHTML={{ __html: response.body }} 
            className="h-full overflow-auto"
          />
        ) : viewMode === 'source' ? (
          <pre className="p-4 font-mono text-xs text-cyan-300 whitespace-pre-wrap leading-relaxed">
            {response.body}
          </pre>
        ) : (
          <div className="p-4 font-mono text-xs space-y-2">
            <div className="text-emerald-400 font-bold">
              HTTP/1.1 {response.status} {response.statusText}
            </div>
            <div className="space-y-1 text-slate-300 border-t border-slate-800 pt-2">
              {Object.entries(response.headers).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-cyan-400 font-semibold">{k}:</span>
                  <span className="text-slate-300">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Browser Footer Status */}
      <div className="px-3 py-1 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span>Status: {response.status} {response.statusText}</span>
        <span>Host: {currentUrl}</span>
      </div>
    </div>
  );
};
