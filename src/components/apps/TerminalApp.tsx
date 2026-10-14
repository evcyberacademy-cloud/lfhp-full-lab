'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useVFS } from '@/context/VFSContext';
import { useDesktop } from '@/context/DesktopContext';
import { useLab } from '@/context/LabContext';
import { useAuth } from '@/context/AuthContext';
import { SoundEffects } from '@/lib/sounds/sound-effects';
import { 
  TerminalOutputLine, 
  NanoState,
  InteractivePromptState
} from '@/types/terminal';
import { 
  Terminal as TermIcon, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Copy, 
  HelpCircle,
  Save,
  X
} from 'lucide-react';

export const TerminalApp: React.FC = () => {
  const { vfsState, vfsEngine, executeCommand, resumeScript, cwd, writeFile } = useVFS();
  const { settings, isMobile } = useDesktop();
  const { validateCurrentTask } = useLab();
  const { authState } = useAuth();

  const [input, setInput] = useState('');
  const [interactivePrompt, setInteractivePrompt] = useState<InteractivePromptState | null>(null);
  const [output, setOutput] = useState<TerminalOutputLine[]>([
    {
      id: 'init_banner',
      type: 'info',
      content: `\x1b[1;36m=================================================================\x1b[0m
\x1b[1;32m   EV CYBER ACADEMY - VIRTUAL LINUX & LFHP CYBER LABS\x1b[0m
\x1b[1;36m=================================================================\x1b[0m
* Student: \x1b[1;33m${authState.student?.studentName || 'LFHP Student'}\x1b[0m | User: \x1b[1;32mstudent\x1b[0m | Host: \x1b[1;34mevcyber\x1b[0m
* Learn the Fundamentals of Hacking Program (LFHP)
* Type \x1b[1;32mman\x1b[0m or launch \x1b[1;32mLab Center\x1b[0m to view guided interactive tasks.
`,
      timestamp: Date.now(),
    }
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [fontSize, setFontSize] = useState<number>(settings.terminalFontSize || 13);
  const [isExecuting, setIsExecuting] = useState(false);

  // Nano state
  const [nanoState, setNanoState] = useState<NanoState | null>(null);
  const [nanoText, setNanoText] = useState<string>('');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nanoTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output, input]);

  // Focus input when clicking anywhere in terminal
  const handleTerminalClick = () => {
    if (nanoState) {
      nanoTextAreaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  };

  // Convert ANSI color codes to styled HTML
  const renderAnsiText = (text: string) => {
    const parts = text.split(/(\x1b\[[0-9;]*m)/g);
    let currentColor = '';
    let isBold = false;

    const elements: React.ReactNode[] = [];

    parts.forEach((part, index) => {
      if (part.startsWith('\x1b[')) {
        if (part === '\x1b[0m') {
          currentColor = '';
          isBold = false;
        } else if (part === '\x1b[1;32m' || part === '\x1b[32m') {
          currentColor = 'text-emerald-400';
          isBold = part.includes('1;');
        } else if (part === '\x1b[1;34m' || part === '\x1b[34m') {
          currentColor = 'text-sky-400';
          isBold = part.includes('1;');
        } else if (part === '\x1b[1;36m' || part === '\x1b[36m') {
          currentColor = 'text-cyan-400';
          isBold = part.includes('1;');
        } else if (part === '\x1b[1;31m' || part === '\x1b[31m') {
          currentColor = 'text-rose-400';
          isBold = part.includes('1;');
        } else if (part === '\x1b[1;33m' || part === '\x1b[33m') {
          currentColor = 'text-amber-400';
          isBold = part.includes('1;');
        } else if (part === '\x1b[35m' || part === '\x1b[1;35m') {
          currentColor = 'text-purple-400';
          isBold = part.includes('1;');
        }
      } else if (part) {
        elements.push(
          <span
            key={index}
            className={`${currentColor || 'text-slate-200'} ${isBold ? 'font-bold' : ''}`}
          >
            {part}
          </span>
        );
      }
    });

    return elements;
  };

  const promptUser = vfsEngine?.getUser() || 'student';
  const promptSymbol = promptUser === 'root' ? '#' : '$';
  const displayCwd = cwd === '/home/student' ? '~' : cwd.startsWith('/home/student/') ? '~' + cwd.slice(13) : cwd;

  // Execute terminal input
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If we are in an interactive prompt (e.g. read command / bash script input)
    if (interactivePrompt) {
      const promptVal = input;
      const maskedInput = interactivePrompt.isSilent ? '*'.repeat(promptVal.length) : promptVal;
      
      SoundEffects.playKeyClick();
      setIsExecuting(true);

      const promptLine: TerminalOutputLine = {
        id: `prompt_${Date.now()}`,
        type: 'stdout',
        content: `${interactivePrompt.prompt}${maskedInput}\n`,
        timestamp: Date.now(),
      };
      
      setOutput(prev => [...prev, promptLine]);
      setInput('');

      try {
        const res = await resumeScript(promptVal, interactivePrompt);
        
        if (res.clearTerminal) {
          setOutput([]);
          setInteractivePrompt(null);
          setIsExecuting(false);
          return;
        }

        const newLines: TerminalOutputLine[] = [];
        if (res.stdout) {
          newLines.push({
            id: `out_${Date.now()}`,
            type: 'stdout',
            content: res.stdout,
            timestamp: Date.now(),
          });
        }
        if (res.stderr) {
          newLines.push({
            id: `err_${Date.now()}`,
            type: 'stderr',
            content: `\x1b[1;31m${res.stderr}\x1b[0m`,
            timestamp: Date.now(),
          });
        }
        setOutput(prev => [...prev, ...newLines]);

        if (res.interactivePrompt) {
          setInteractivePrompt(res.interactivePrompt);
        } else {
          setInteractivePrompt(null);
        }

        validateCurrentTask(promptVal, res.stdout);
      } catch (err: any) {
        setInteractivePrompt(null);
        setOutput(prev => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            type: 'stderr',
            content: `\x1b[1;31mError: ${err?.message || 'Execution error'}\x1b[0m\n`,
            timestamp: Date.now(),
          }
        ]);
      } finally {
        setIsExecuting(false);
      }
      return;
    }

    const cmd = input.trim();
    if (!cmd) {
      setOutput(prev => [
        ...prev,
        {
          id: `line_${Date.now()}`,
          type: 'prompt',
          content: `${promptUser}@evcyber:${displayCwd}${promptSymbol} `,
          timestamp: Date.now(),
        }
      ]);
      return;
    }

    SoundEffects.playKeyClick();
    setIsExecuting(true);

    // Add to history
    setHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    // Prompt Line
    const promptLine: TerminalOutputLine = {
      id: `cmd_${Date.now()}`,
      type: 'prompt',
      content: `${promptUser}@evcyber:${displayCwd}${promptSymbol} ${cmd}`,
      timestamp: Date.now(),
    };

    setInput('');

    try {
      const res = await executeCommand(cmd);

      if (res.clearTerminal) {
        setOutput([]);
        setIsExecuting(false);
        return;
      }

      if (res.launchNano) {
        setNanoState({
          isActive: true,
          filePath: res.launchNano.filePath,
          content: res.launchNano.initialContent.split('\n'),
          cursorRow: 0,
          cursorCol: 0,
          statusMessage: `[ Reading ${res.launchNano.initialContent.length} bytes ]`,
          isModified: false,
        });
        setNanoText(res.launchNano.initialContent);
        setIsExecuting(false);
        return;
      }

      const newLines: TerminalOutputLine[] = [promptLine];

      if (res.stdout) {
        newLines.push({
          id: `out_${Date.now()}`,
          type: 'stdout',
          content: res.stdout,
          timestamp: Date.now(),
        });
      }

      if (res.stderr) {
        newLines.push({
          id: `err_${Date.now()}`,
          type: 'stderr',
          content: `\x1b[1;31m${res.stderr}\x1b[0m`,
          timestamp: Date.now(),
        });
      }

      setOutput(prev => [...prev, ...newLines]);

      if (res.interactivePrompt) {
        setInteractivePrompt(res.interactivePrompt);
      } else {
        setInteractivePrompt(null);
      }

      // Trigger Lab real-time validation
      validateCurrentTask(cmd, res.stdout);
    } catch (err: any) {
      setOutput(prev => [
        ...prev,
        promptLine,
        {
          id: `err_${Date.now()}`,
          type: 'stderr',
          content: `\x1b[1;31mError: ${err?.message || 'Execution error'}\x1b[0m\n`,
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  // History & Tab completion key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion();
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setOutput([]);
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      if (interactivePrompt) {
        setOutput(prev => [
          ...prev,
          {
            id: `int_cancel_${Date.now()}`,
            type: 'stdout',
            content: `${interactivePrompt.prompt}${input}^C\n`,
            timestamp: Date.now(),
          }
        ]);
        setInteractivePrompt(null);
      } else {
        setOutput(prev => [
          ...prev,
          {
            id: `int_${Date.now()}`,
            type: 'prompt',
            content: `${promptUser}@evcyber:${displayCwd}${promptSymbol} ${input}^C`,
            timestamp: Date.now(),
          }
        ]);
      }
      setInput('');
    }
  };

  // Tab completion
  const handleTabCompletion = () => {
    const tokens = input.split(/\s+/);
    const lastToken = tokens[tokens.length - 1];

    if (tokens.length === 1 && !lastToken.startsWith('/') && !lastToken.startsWith('.')) {
      // Command autocompletion
      const commonCommands = [
        'pwd', 'ls', 'cd', 'mkdir', 'rmdir', 'touch', 'cat', 'head', 'tail', 'cp', 'mv', 'rm',
        'clear', 'echo', 'grep', 'find', 'which', 'whereis', 'file', 'stat', 'wc', 'sort', 'uniq',
        'cut', 'awk', 'sed', 'less', 'more', 'nano', 'chmod', 'chown', 'whoami', 'id', 'ps',
        'top', 'kill', 'uname', 'hostname', 'env', 'export', 'history', 'man', 'ip', 'ifconfig',
        'ping', 'traceroute', 'nslookup', 'dig', 'host', 'curl', 'wget', 'ss', 'netstat', 'arp',
        'route', 'nmap', 'sudo'
      ];
      const matches = commonCommands.filter(c => c.startsWith(lastToken));
      if (matches.length === 1) {
        setInput(matches[0] + ' ');
      }
      return;
    }

    // Path autocompletion
    const pathPrefix = lastToken;
    let dirToSearch = cwd;
    let filePrefix = pathPrefix;

    if (pathPrefix.includes('/')) {
      const lastSlash = pathPrefix.lastIndexOf('/');
      const parentDir = pathPrefix.slice(0, lastSlash) || '/';
      filePrefix = pathPrefix.slice(lastSlash + 1);
      dirToSearch = vfsEngine ? vfsEngine.resolvePath(parentDir) : cwd;
    }

    const listRes = vfsEngine?.listDirectory(dirToSearch);
    if (listRes?.success && listRes.data) {
      const matches = listRes.data.filter(n => n.name.startsWith(filePrefix));
      if (matches.length === 1) {
        const completedName = matches[0].name + (matches[0].type === 'directory' ? '/' : ' ');
        const pathHead = pathPrefix.includes('/') ? pathPrefix.slice(0, pathPrefix.lastIndexOf('/') + 1) : '';
        tokens[tokens.length - 1] = pathHead + completedName;
        setInput(tokens.join(' '));
      }
    }
  };

  // Nano handlers
  const handleNanoSave = () => {
    if (!nanoState) return;
    writeFile(nanoState.filePath, nanoText);
    setNanoState(prev => prev ? { ...prev, isModified: false, statusMessage: `[ Wrote ${nanoText.length} bytes to ${nanoState.filePath} ]` } : null);
    SoundEffects.playTaskSuccess();
    validateCurrentTask();
  };

  const handleNanoExit = () => {
    setNanoState(null);
    setOutput(prev => [
      ...prev,
      {
        id: `nano_exit_${Date.now()}`,
        type: 'info',
        content: `\x1b[1;32m[ Exited nano ]\x1b[0m\n`,
        timestamp: Date.now(),
      }
    ]);
  };

  // Quick Mobile Key insertion
  const insertKey = (char: string) => {
    if (char === 'TAB') {
      handleTabCompletion();
    } else if (char === 'UP') {
      if (history.length > 0) {
        const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (char === 'DOWN') {
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(nextIdx);
          setInput(history[nextIdx]);
        }
      }
    } else if (char === 'CLEAR') {
      setOutput([]);
    } else {
      setInput(prev => prev + char);
    }
    inputRef.current?.focus();
  };

  // Custom Theme Class Map
  const themeClass = settings.terminalTheme === 'matrix-green'
    ? 'text-emerald-400 font-mono bg-black'
    : settings.terminalTheme === 'amber-phosphor'
    ? 'text-amber-400 font-mono bg-slate-950'
    : settings.terminalTheme === 'dracula'
    ? 'text-purple-300 font-mono bg-slate-950'
    : settings.terminalTheme === 'monokai'
    ? 'text-yellow-200 font-mono bg-slate-950'
    : 'text-slate-100 font-mono bg-[#0a0e17]';

  return (
    <div 
      onClick={handleTerminalClick}
      className={`h-full flex flex-col select-text ${themeClass}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Terminal Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs select-none">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold font-mono text-[11px]">
          <TermIcon className="w-3.5 h-3.5" />
          <span>EV-BASH (v5.2)</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
            title="Decrease Font Size"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFontSize(prev => Math.min(22, prev + 1))}
            title="Increase Font Size"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setOutput([])}
            title="Clear Terminal Output (Ctrl+L)"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Interactive Nano Mode */}
      {nanoState ? (
        <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 p-2 overflow-hidden">
          {/* Nano Header */}
          <div className="bg-slate-200 text-slate-950 font-bold px-2 py-0.5 text-xs flex justify-between items-center select-none font-mono">
            <span>GNU nano 7.2</span>
            <span>File: {nanoState.filePath}</span>
            <span>{nanoState.isModified ? '[Modified]' : ''}</span>
          </div>

          {/* Text Area */}
          <textarea
            ref={nanoTextAreaRef}
            autoFocus
            value={nanoText}
            onChange={e => {
              setNanoText(e.target.value);
              setNanoState(prev => prev ? { ...prev, isModified: true } : null);
            }}
            onKeyDown={e => {
              if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                handleNanoSave();
              } else if (e.ctrlKey && e.key === 'x') {
                e.preventDefault();
                handleNanoExit();
              }
            }}
            className="flex-1 w-full bg-slate-950 text-slate-100 font-mono p-2 focus:outline-none resize-none overflow-auto border-none leading-relaxed text-sm"
          />

          {/* Nano Status Message */}
          <div className="text-cyan-400 text-xs px-2 py-1 bg-slate-900 border-t border-slate-800 font-mono">
            {nanoState.statusMessage}
          </div>

          {/* Nano Footer Shortcuts Bar */}
          <div className="bg-slate-900 px-2 py-1 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono select-none">
            <button
              onClick={handleNanoSave}
              className="flex items-center gap-1.5 text-emerald-400 hover:bg-slate-800 px-2 py-1 rounded"
            >
              <span className="font-bold bg-slate-800 px-1 rounded">^O</span>
              <span>WriteOut (Save)</span>
            </button>
            <button
              onClick={handleNanoExit}
              className="flex items-center gap-1.5 text-rose-400 hover:bg-slate-800 px-2 py-1 rounded"
            >
              <span className="font-bold bg-slate-800 px-1 rounded">^X</span>
              <span>Exit</span>
            </button>
          </div>
        </div>
      ) : (
        /* Regular Bash Shell Terminal View */
        <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden font-mono space-y-1">
          {output.map((line) => (
            <div key={line.id} className="whitespace-pre-wrap break-all leading-relaxed">
              {line.type === 'prompt' ? (
                line.content.includes('@evcyber:') ? (
                  <div className="flex items-center gap-1 font-semibold">
                    <span className="text-emerald-400">{promptUser}@evcyber</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-sky-400">{displayCwd}</span>
                    <span className="text-cyan-400">{promptSymbol}</span>
                    <span className="text-slate-100 ml-1">{line.content.replace(/^.*[$#]\s*/, '')}</span>
                  </div>
                ) : (
                  <div className="font-semibold text-amber-300">
                    {renderAnsiText(line.content)}
                  </div>
                )
              ) : (
                renderAnsiText(line.content)
              )}
            </div>
          ))}

          {/* Active Command Prompt Line */}
          <form onSubmit={handleCommandSubmit} className="flex items-center gap-1 pt-1">
            {interactivePrompt ? (
              <span className="text-amber-300 font-semibold shrink-0">
                {renderAnsiText(interactivePrompt.prompt || '> ')}
              </span>
            ) : (
              <>
                <span className="text-emerald-400 font-semibold shrink-0">{promptUser}@evcyber</span>
                <span className="text-slate-400 shrink-0">:</span>
                <span className="text-sky-400 shrink-0">{displayCwd}</span>
                <span className="text-cyan-400 font-bold shrink-0">{promptSymbol}</span>
              </>
            )}
            <input
              ref={inputRef}
              type={interactivePrompt?.isSilent ? 'password' : 'text'}
              autoFocus
              disabled={isExecuting}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-slate-100 focus:outline-none border-none p-0 font-mono tracking-wide"
              spellCheck={false}
              autoComplete="off"
            />
          </form>

          <div ref={terminalEndRef} />
        </div>
      )}

      {/* Mobile & Touch Helper Keys Ribbon */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-900/95 border-t border-slate-800 overflow-x-auto select-none">
        {['TAB', 'UP', 'DOWN', '|', '>', '>>', '/', '-', '~', 'CLEAR'].map(k => (
          <button
            key={k}
            type="button"
            onClick={() => insertKey(k)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 text-xs font-mono text-slate-300 active:scale-95 transition-all shrink-0"
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
};
