'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, Terminal, User, KeyRound, ArrowRight, Sparkles, Volume2 } from 'lucide-react';
import { SpeechService } from '@/lib/speech/speech-service';

export const AccessGate: React.FC = () => {
  const { login } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('Please enter your Student Name');
      return;
    }
    if (!accessCode.trim()) {
      setError('Please enter your LFHP Access Code');
      return;
    }

    SpeechService.init();
    setIsBooting(true);
    setTimeout(() => {
      login(studentName, accessCode);
    }, 500);
  };

  const handleQuickDemo = () => {
    setStudentName('Alex Mercer');
    setAccessCode('LFHP-2026');
    SpeechService.init();
    setIsBooting(true);
    setTimeout(() => {
      login('Alex Mercer', 'LFHP-2026');
    }, 500);
  };

  return (
    <div className="min-h-screen w-full bg-[#04070d] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background Cyber Grid Lines */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Subtle Cyan Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Access Card */}
      <div className="w-full max-w-md bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-8 shadow-cyber-glow backdrop-blur-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header with Company Logo & LFHP Course Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* EV Cyber Academy Company Logo */}
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 p-1.5 flex items-center justify-center shadow-cyber-glow">
              <img 
                src="/company-logo.jpg" 
                alt="EV Cyber Academy Company Logo" 
                className="w-14 h-14 object-contain rounded-xl drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]" 
              />
            </div>
            {/* LFHP Course Logo */}
            <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-emerald-500/40 p-1.5 flex items-center justify-center shadow-cyber-glow">
              <img 
                src="/lfhp-logo.png" 
                alt="LFHP Course Logo" 
                className="w-14 h-14 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]" 
              />
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-cyan-400 uppercase mb-1">
            EV CYBER ACADEMY
          </span>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            EV CYBER-LABS
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-mono">
            Learn the Fundamentals of Hacking Program (LFHP)
          </p>
        </div>

        {/* Access Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              1. Student Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              2. Access Code
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
                placeholder="e.g. LFHP-2026"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm font-mono tracking-wider transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isBooting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-cyber-glow group mt-6"
          >
            <span>{isBooting ? 'Booting Virtual Linux...' : 'Enter Linux Desktop'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Demo Fast Track Button */}
        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="text-xs text-slate-400 hover:text-cyan-400 font-mono transition-colors"
          >
            ⚡ Quick Start Demo (LFHP Student)
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-center text-slate-500 text-xs font-mono relative z-10">
        <span>EV CYBER ACADEMY © 2026 • Browser-Based Linux Simulation</span>
      </div>
    </div>
  );
};
