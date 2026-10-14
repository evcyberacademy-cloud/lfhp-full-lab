'use client';

import React, { useState, useEffect } from 'react';
import { useVFS } from '@/context/VFSContext';
import { useAuth } from '@/context/AuthContext';
import { SoundEffects } from '@/lib/sounds/sound-effects';
import { SpeechService } from '@/lib/speech/speech-service';
import { AlertTriangle, Flame, RefreshCw, Zap, ShieldAlert, Terminal } from 'lucide-react';

interface OSCrashOverlayProps {
  onRecovered?: () => void;
}

export const OSCrashOverlay: React.FC<OSCrashOverlayProps> = ({ onRecovered }) => {
  const { resetVFS } = useVFS();
  const { authState } = useAuth();
  const studentName = authState.student?.studentName || 'Student';

  const [isCrashed, setIsCrashed] = useState(false);
  const [triggerCmd, setTriggerCmd] = useState('sudo rm -rf /*');
  const [remainingSeconds, setRemainingSeconds] = useState(300); // 5 minutes
  const [recoveryLogs, setRecoveryLogs] = useState<string[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);

  // Check if system is currently in crashed state
  useEffect(() => {
    const checkCrashState = () => {
      try {
        const crashUntilStr = localStorage.getItem('lfhp_os_crash_until');
        if (crashUntilStr) {
          const crashUntil = parseInt(crashUntilStr, 10);
          const now = Date.now();
          if (now < crashUntil) {
            const secsLeft = Math.max(1, Math.ceil((crashUntil - now) / 1000));
            setRemainingSeconds(secsLeft);
            setIsCrashed(true);
            const savedCmd = localStorage.getItem('lfhp_os_crash_cmd') || 'sudo rm -rf /*';
            setTriggerCmd(savedCmd);
          } else {
            // Expired -> auto recover
            handleAutoRecovery();
          }
        }
      } catch {}
    };

    checkCrashState();

    const handleCrashEvent = (e: any) => {
      const cmd = e.detail?.triggerCommand || 'sudo rm -rf /*';
      const durationMs = 5 * 60 * 1000; // 5 minutes
      const crashUntil = Date.now() + durationMs;

      localStorage.setItem('lfhp_os_crash_until', crashUntil.toString());
      localStorage.setItem('lfhp_os_crash_cmd', cmd);

      setTriggerCmd(cmd);
      setRemainingSeconds(300);
      setIsCrashed(true);

      SoundEffects.playError();
      SpeechService.speakText('Critical system failure. Virtual Linux root filesystem destroyed. Initiating emergency operating system rebuild.');
    };

    window.addEventListener('lfhp:os_crash', handleCrashEvent);
    const interval = setInterval(checkCrashState, 1000);

    return () => {
      window.removeEventListener('lfhp:os_crash', handleCrashEvent);
      clearInterval(interval);
    };
  }, []);

  // Countdown timer and simulated rebuild log stream
  useEffect(() => {
    if (!isCrashed) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoRecovery();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Initial crash logs
    const logs = [
      `[   0.000000] Linux version 6.1.0-21-amd64 (evcyber@builder) (gcc 12.2.0)`,
      `[   0.004120] Command executed: "${triggerCmd}" (Recursive root destruction)`,
      `[   0.008912] Kernel panic - not syncing: Attempted to kill init! exitcode=0x0000000b`,
      `[   0.014201] CPU: 0 PID: 1 Comm: rm Tainted: G        W  O      6.1.0-21-amd64`,
      `[   0.021040] Hardware name: EVCYBER Virtual Platform / QEMU Standard PC`,
      `[   0.035411] VFS: Root directory / deleted. Inodes wiped. Kernel unlinked.`,
      `[   0.048992] ---[ end Kernel panic - not syncing: VFS destroyed ]---`,
      `[RECOVERY] ==========================================================`,
      `[RECOVERY] LFHP AUTOMATED DISASTER RECOVERY PROTOCOL ENGAGED (5 MIN COOLDOWN)`,
      `[RECOVERY] Rebuilding ext4 virtual filesystem partitions from golden image...`,
      `[RECOVERY] Please wait while virtual Linux re-flashes...`,
    ];
    setRecoveryLogs(logs);

    return () => clearInterval(timer);
  }, [isCrashed, triggerCmd]);

  const handleAutoRecovery = async () => {
    setIsRecovering(true);
    try {
      localStorage.removeItem('lfhp_os_crash_until');
      localStorage.removeItem('lfhp_os_crash_cmd');
      await resetVFS();
    } catch {}

    setTimeout(() => {
      setIsCrashed(false);
      setIsRecovering(false);
      SoundEffects.playTaskSuccess();
      SpeechService.speakWelcome(studentName);
      onRecovered?.();
    }, 800);
  };

  const handleInstantEmergencyFlash = async () => {
    setIsRecovering(true);
    SoundEffects.playTaskSuccess();
    try {
      localStorage.removeItem('lfhp_os_crash_until');
      localStorage.removeItem('lfhp_os_crash_cmd');
      await resetVFS();
    } catch {}

    setTimeout(() => {
      setIsCrashed(false);
      setIsRecovering(false);
      SpeechService.speakWelcome(studentName);
      onRecovered?.();
    }, 600);
  };

  if (!isCrashed) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, ((300 - remainingSeconds) / 300) * 100));

  return (
    <div className="fixed inset-0 z-[9999] bg-[#02040a] text-red-400 font-mono select-none flex flex-col items-center justify-between p-6 sm:p-10 overflow-hidden">
      {/* Glitch & CRT Shader Lines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,0,0,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] opacity-70" />
      <div className="absolute inset-0 bg-red-950/10 pointer-events-none animate-pulse" />

      {/* Top Banner Alert */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b border-red-500/40 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500 flex items-center justify-center animate-bounce">
            <Flame className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-widest text-red-400 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> KERNEL PANIC — OS DESTROYED
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              LFHP VIRTUAL LINUX CORRUPTED
            </h1>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase">Cooldown Status</span>
          <span className="text-sm font-bold text-red-400 font-mono animate-pulse">REBUILDING</span>
        </div>
      </div>

      {/* Center Cooldown Timer & System Console */}
      <div className="w-full max-w-4xl my-auto space-y-6 relative z-10">
        <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-6 backdrop-blur-xl shadow-[0_0_50px_rgba(239,68,68,0.25)] text-center space-y-4">
          <p className="text-xs text-slate-300 font-sans max-w-xl mx-auto">
            You executed <code className="text-red-400 font-bold bg-black/60 px-2 py-0.5 rounded border border-red-500/40">{triggerCmd}</code> which completely removed the root filesystem (<code className="text-red-300">/</code>). The OS has been nuked.
          </p>

          {/* Big 5-Minute Timer Display */}
          <div className="py-2">
            <span className="text-[11px] uppercase tracking-widest text-slate-400 block mb-1">
              Automatic System Restoration Countdown (5 Minutes)
            </span>
            <div className="text-5xl sm:text-7xl font-black text-red-500 tracking-widest font-mono drop-shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse">
              {formattedTime}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto space-y-1.5">
            <div className="h-3 w-full bg-slate-900 rounded-full border border-red-500/40 overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Rebuilding Filesystem</span>
              <span>{progressPercent.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Live Kernel Panic Terminal Dump */}
        <div className="rounded-xl bg-black/90 border border-red-500/30 p-4 font-mono text-[11px] text-slate-300 max-h-48 overflow-y-auto space-y-1 shadow-inner">
          <div className="flex items-center gap-1.5 text-red-400 border-b border-red-900/60 pb-1.5 mb-2 font-bold text-[10px] uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" /> Emergency Disaster Recovery Console
          </div>
          {recoveryLogs.map((line, idx) => (
            <p key={idx} className={line.startsWith('[RECOVERY]') ? 'text-amber-300' : 'text-slate-400'}>
              {line}
            </p>
          ))}
          <p className="text-emerald-400 animate-pulse">
            [REBUILDING] Restoring system binaries... ({remainingSeconds}s remaining)
          </p>
        </div>
      </div>

      {/* Bottom Actions: Emergency Instant Fast-Flash Override */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-red-500/30 pt-4 relative z-10 text-xs">
        <span className="text-slate-400 text-center sm:text-left text-[11px] font-sans">
          In a live security lab, destroying the rootfs requires full VM re-flashing.
        </span>

        <button
          onClick={handleInstantEmergencyFlash}
          disabled={isRecovering}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:scale-105 active:scale-95"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>{isRecovering ? 'Restoring System...' : '⚡ Instant Emergency Fast-Flash'}</span>
        </button>
      </div>
    </div>
  );
};
