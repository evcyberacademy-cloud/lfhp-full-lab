'use client';

import React, { useState } from 'react';
import { useDesktop } from '@/context/DesktopContext';
import { useVFS } from '@/context/VFSContext';
import { useLab } from '@/context/LabContext';
import { useAuth } from '@/context/AuthContext';
import { DesktopWallpaper, TerminalTheme } from '@/types/settings';
import { SoundEffects } from '@/lib/sounds/sound-effects';
import { 
  Settings, 
  Palette, 
  HardDrive, 
  Download, 
  Upload, 
  RefreshCw, 
  User, 
  Shield,
  Check,
  Edit3,
  FileJson,
  Sparkles,
  Save
} from 'lucide-react';

export const SettingsApp: React.FC = () => {
  const { settings, updateSettings } = useDesktop();
  const { resetVFS } = useVFS();
  const { progress, resetAllProgress, importProgress } = useLab();
  const { authState, updateStudent } = useAuth();

  const [activeTab, setActiveTab] = useState<'appearance' | 'account' | 'storage'>('appearance');
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    dataName?: string;
    studentName?: string;
    taskCount?: number;
    message: string;
  } | null>(null);

  const [editName, setEditName] = useState(authState.student?.studentName || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameSaveMsg, setNameSaveMsg] = useState(false);

  const wallpapers: { id: DesktopWallpaper; label: string }[] = [
    { id: 'cyber-grid', label: 'Cyber Grid (Obsidian)' },
    { id: 'hex-matrix', label: 'Hex Matrix' },
    { id: 'deep-space', label: 'Deep Space' },
    { id: 'dark-obsidian', label: 'Dark Minimalist' },
    { id: 'blue-circuit', label: 'Blue Circuit' },
  ];

  const terminalThemes: { id: TerminalTheme; label: string; color: string }[] = [
    { id: 'cyber-cyan', label: 'Cyber Cyan', color: '#00f0ff' },
    { id: 'matrix-green', label: 'Matrix Green', color: '#10b981' },
    { id: 'monokai', label: 'Monokai Yellow', color: '#f59e0b' },
    { id: 'dracula', label: 'Dracula Purple', color: '#a855f7' },
    { id: 'amber-phosphor', label: 'Amber Phosphor CRT', color: '#fbbf24' },
  ];

  const handleSaveStudentName = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    updateStudent({ studentName: trimmed });
    setIsEditingName(false);
    setNameSaveMsg(true);
    SoundEffects.playTaskSuccess();
    setTimeout(() => setNameSaveMsg(false), 3000);
  };

  const exportProgressJson = () => {
    const currentStudentName = authState.student?.studentName || 'Student';
    const safeName = currentStudentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const exportPayload = {
      exportedDataName: `LFHP Export Settings - ${currentStudentName}`,
      fileType: 'LFHP_EXP_SETTINGS',
      app: 'LFHP EV CYBER-LABS',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      student: authState.student || {
        studentName: currentStudentName,
        accessCode: 'LFHP-2026',
        linuxUsername: 'student',
        hostname: 'evcyber',
        homeDir: '/home/student',
        loginTimestamp: Date.now(),
      },
      settings: settings,
      progress: progress,
    };

    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute("href", jsonString);
    downloadLink.setAttribute("download", `exp_settings_${safeName}.json`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    SoundEffects.playKeyClick();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        let restoredCount = 0;
        let restoredStudentName = '';
        const dataName = parsed.exportedDataName || parsed.title || 'Exported Settings';

        // 1. Restore Student Profile
        if (parsed.student && parsed.student.studentName) {
          updateStudent(parsed.student);
          restoredStudentName = parsed.student.studentName;
          setEditName(parsed.student.studentName);
        } else if (parsed.studentName) {
          updateStudent({ studentName: parsed.studentName });
          restoredStudentName = parsed.studentName;
          setEditName(parsed.studentName);
        }

        // 2. Restore Desktop User Settings
        if (parsed.settings) {
          updateSettings(parsed.settings);
        }

        // 3. Restore Lab Progress
        if (parsed.progress) {
          importProgress(parsed.progress);
          restoredCount = parsed.progress.completedTaskIds?.length || 0;
        } else if (parsed.completedTaskIds) {
          importProgress({ completedTaskIds: parsed.completedTaskIds });
          restoredCount = parsed.completedTaskIds.length || 0;
        }

        SoundEffects.playTaskSuccess();
        setImportStatus({
          success: true,
          dataName: dataName,
          studentName: restoredStudentName || authState.student?.studentName || 'Student',
          taskCount: restoredCount,
          message: `Successfully imported "${dataName}". All settings, student profile, and lab progress are now active!`,
        });

      } catch (err) {
        setImportStatus({
          success: false,
          message: 'Failed to parse JSON. Please provide a valid LFHP export settings file.',
        });
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be reselected
    e.target.value = '';
  };

  return (
    <div className="h-full flex bg-slate-950 text-slate-100 select-none">
      {/* Left Navigation */}
      <div className="w-56 bg-slate-900/80 border-r border-slate-800 p-3 space-y-1 text-xs flex flex-col justify-between">
        <div className="space-y-1">
          {/* Logo Header in Settings Sidebar */}
          <div className="flex items-center gap-3 px-2 py-2.5 mb-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <img 
              src="/company-logo.jpg" 
              alt="EV Cyber Academy Logo" 
              className="w-9 h-9 object-contain rounded-lg drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" 
            />
            <div>
              <p className="font-bold text-slate-100 font-mono text-[11px] leading-tight">EV CYBER-LABS</p>
              <p className="text-[9px] text-cyan-400 font-mono tracking-wider">SETTINGS & DATA</p>
            </div>
          </div>

          <span className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            System Control
          </span>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
              activeTab === 'appearance' ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm' : 'hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Appearance & Theme</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
              activeTab === 'account' ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm' : 'hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            <User className="w-4 h-4 text-cyan-400" />
            <span>Student Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
              activeTab === 'storage' ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm' : 'hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Export & Import Data</span>
          </button>
        </div>

        <div className="px-2 py-2 text-[10px] font-mono text-slate-500 border-t border-slate-800 flex items-center justify-between">
          <span>LFHP OS v1.0.0</span>
          <span className="text-cyan-400">ONLINE</span>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="font-bold text-sm text-slate-200 mb-1">Desktop Wallpaper</h3>
              <p className="text-slate-400 text-[11px] mb-3">Select the background theme for your virtual Linux workspace.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {wallpapers.map(wp => (
                  <button
                    key={wp.id}
                    onClick={() => updateSettings({ wallpaper: wp.id })}
                    className={`text-left px-3.5 py-3 rounded-xl border transition-all ${
                      settings.wallpaper === wp.id
                        ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 font-semibold ring-1 ring-cyan-400/50 shadow-cyber-glow'
                        : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {wp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h3 className="font-bold text-sm text-slate-200 mb-1">Terminal Color Scheme</h3>
              <div className="space-y-2 mt-3">
                {terminalThemes.map(th => (
                  <button
                    key={th.id}
                    onClick={() => updateSettings({ terminalTheme: th.id })}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                      settings.terminalTheme === th.id
                        ? 'bg-slate-800 border-cyan-400 text-slate-100 font-semibold ring-1 ring-cyan-400/40'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span>{th.label}</span>
                    <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: th.color }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Student Profile Tab */}
        {activeTab === 'account' && (
          <div className="space-y-6 max-w-xl">
            {/* Dual Academy & Course Logo Emblem Card (Medium Size) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/40 flex flex-wrap sm:flex-nowrap items-center gap-5 shadow-cyber-glow">
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* EV Cyber Academy Company Logo */}
                <div className="w-18 h-18 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 p-2 flex items-center justify-center shadow-cyber-glow">
                  <img 
                    src="/company-logo.jpg" 
                    alt="EV Cyber Academy Company Logo" 
                    className="w-14 h-14 object-contain rounded-xl drop-shadow-[0_0_10px_rgba(0,240,255,0.7)]" 
                  />
                </div>
                {/* LFHP Course Logo */}
                <div className="w-18 h-18 rounded-2xl bg-slate-900/90 border border-emerald-500/50 p-2 flex items-center justify-center shadow-cyber-glow">
                  <img 
                    src="/lfhp-logo.png" 
                    alt="LFHP Course Logo" 
                    className="w-14 h-14 object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.7)]" 
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-400 font-bold block">
                  EV CYBER ACADEMY • OFFICIAL LFHP COURSE
                </span>
                <h2 className="text-base font-black text-slate-100 font-mono tracking-tight">
                  EV CYBER SECURITY ACADEMY
                </h2>
                <p className="text-[11px] text-cyan-300 font-mono mt-0.5">Learn Fundamentals of Hacking Program (LFHP)</p>
                <p className="text-[10px] text-slate-400 mt-1">Virtual Linux Simulation & Web Security Labs</p>
              </div>
            </div>

            {/* Student Name Editor */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-200">Active Student Identity</h3>
                <button
                  onClick={() => setIsEditingName(prev => !prev)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingName ? 'Cancel' : 'Edit Name'}</span>
                </button>
              </div>

              {isEditingName ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Enter Student Name"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-cyan-500/50 text-slate-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    onClick={handleSaveStudentName}
                    className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 font-mono">
                  <span className="text-slate-400">Student Name:</span>
                  <span className="text-cyan-300 font-bold text-sm">{authState.student?.studentName || 'Student'}</span>
                </div>
              )}

              {nameSaveMsg && (
                <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Student name updated and saved!
                </p>
              )}
            </div>

            {/* Session Details */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Access Passkey:</span>
                <span className="text-cyan-400 font-bold">{authState.student?.accessCode || 'LFHP-2026'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Linux User:</span>
                <span className="text-emerald-400">student (UID 1000)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Hostname:</span>
                <span className="text-sky-400">evcyber</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Program:</span>
                <span className="text-amber-400">LFHP (Fundamentals of Hacking)</span>
              </div>
            </div>
          </div>
        )}

        {/* Data & Backup Tab */}
        {activeTab === 'storage' && (
          <div className="space-y-6 max-w-xl">
            {/* Export Section */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Export Settings & Labs JSON</h3>
                  <p className="text-slate-400 text-[11px]">
                    Downloads <code className="text-cyan-400">exp_settings_{authState.student?.studentName?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'student'}.json</code> with student name, settings, and progress.
                  </p>
                </div>
              </div>

              <button
                onClick={exportProgressJson}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-cyber-glow transition-all"
              >
                <FileJson className="w-4 h-4" />
                <span>Export JSON File (exp settings)</span>
              </button>
            </div>

            {/* Import Section */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Import Settings & Labs JSON</h3>
                  <p className="text-slate-400 text-[11px]">
                    Load any exported JSON file. It will immediately restore the student name, custom wallpaper, themes, and lab completion tasks.
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-100 font-bold text-xs cursor-pointer transition-colors shadow-sm">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Select JSON File (exp settings)</span>
                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </label>

              {importStatus && (
                <div className={`mt-3 p-3.5 rounded-xl border ${
                  importStatus.success
                    ? 'bg-slate-950/90 border-cyan-500/50 text-slate-200' 
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                } text-xs font-mono animate-in fade-in space-y-1.5`}>
                  <div className="flex items-center gap-2 font-bold text-cyan-300">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>{importStatus.message}</span>
                  </div>
                  {importStatus.success && (
                    <div className="pl-6 space-y-1 text-[11px] text-slate-400">
                      <p>• Restored Student: <span className="text-emerald-400 font-semibold">{importStatus.studentName}</span></p>
                      <p>• Restored Lab Tasks: <span className="text-cyan-400 font-semibold">{importStatus.taskCount} tasks completed</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="font-bold text-sm text-rose-400 mb-1">Danger Zone</h3>
              <p className="text-slate-400 text-[11px] mb-3">Reset the virtual filesystem back to default and clear all saved lab tasks.</p>
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to factory reset everything? All progress will be wiped.')) {
                    await resetVFS();
                    resetAllProgress();
                    alert('System reset complete!');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Factory Reset Filesystem & Labs</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
