'use client';

import React from 'react';
import { useLab } from '@/context/LabContext';
import { CheckCircle2, Shield, X, Award } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { showSuccessToast, lastCompletedTaskTitle, dismissToast } = useLab();

  if (!showSuccessToast || !lastCompletedTaskTitle) return null;

  return (
    <div className="fixed top-12 right-4 z-50 animate-in slide-in-from-top-4 duration-200 max-w-sm">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/95 border border-emerald-500/50 shadow-cyber-glow-emerald backdrop-blur-xl text-slate-100">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="flex-1 pr-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Task Completed!</span>
          </div>
          <p className="text-sm font-medium text-slate-100 mt-1">
            {lastCompletedTaskTitle}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Progress updated in LFHP Lab Center.
          </p>
        </div>

        <button
          onClick={dismissToast}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
