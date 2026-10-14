'use client';

import React, { useState } from 'react';
import { useLab } from '@/context/LabContext';
import { useDesktop } from '@/context/DesktopContext';
import { 
  Shield, 
  CheckCircle2, 
  Circle, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown, 
  Terminal, 
  Award, 
  Lightbulb, 
  Check, 
  Copy,
  BookOpen
} from 'lucide-react';

export const LabCenterApp: React.FC = () => {
  const { 
    curriculum, 
    activeModule, 
    activeTask, 
    setActiveModuleId, 
    setActiveTaskId, 
    isTaskCompleted, 
    isModuleCompleted, 
    percentComplete, 
    progress 
  } = useLab();
  const { openApp } = useDesktop();

  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const toggleHint = (taskId: string) => {
    setOpenHints(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* Top Banner & Progress Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/50 p-1 flex items-center justify-center shadow-cyber-glow flex-shrink-0">
            <img 
              src="/lfhp-logo.png" 
              alt="LFHP Cyber Academy Course Logo" 
              className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-100 text-sm tracking-wide font-mono">
                LFHP CYBER-LABS CURRICULUM
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                ACADEMY LABS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Learn Fundamentals of Hacking Program • Hands-On Terminal & Web Security Labs
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-mono font-bold text-amber-400">{progress.totalScore} PTS</span>
          </div>

          <div className="w-36 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          <span className="font-mono text-xs font-bold text-cyan-400">
            {percentComplete}%
          </span>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Modules List */}
        <div className="w-64 bg-slate-900/60 border-r border-slate-800 p-2 overflow-y-auto space-y-1 text-xs">
          <span className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Lab Modules ({curriculum.length})
          </span>

          {curriculum.map((mod) => {
            const isCompleted = isModuleCompleted(mod.id);
            const isActive = activeModule.id === mod.id;
            const completedInMod = mod.tasks.filter(t => isTaskCompleted(t.id)).length;

            return (
              <button
                key={mod.id}
                onClick={() => setActiveModuleId(mod.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300 shadow-sm'
                    : 'bg-slate-900/40 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                    LAB {mod.number.toString().padStart(2, '0')}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">
                      {completedInMod}/{mod.tasks.length}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-xs text-slate-200 line-clamp-1">
                  {mod.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Active Module Details & Tasks */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {/* Module Header Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                MODULE {activeModule.number} - {activeModule.difficulty.toUpperCase()}
              </span>
              <button
                onClick={() => openApp('terminal')}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Open Terminal</span>
              </button>
            </div>

            <h1 className="text-lg font-bold text-slate-100 mb-1">
              {activeModule.title}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activeModule.summary}
            </p>

            {/* Learning Objectives */}
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <h4 className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
                Objectives
              </h4>
              <ul className="space-y-1 text-xs text-slate-400">
                {activeModule.learningObjectives.map((obj, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tasks Checklist */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Interactive Tasks
            </h3>

            {activeModule.tasks.map((task, idx) => {
              const completed = isTaskCompleted(task.id);
              const isHintOpen = openHints[task.id];

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    completed
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-900/60 border-slate-800/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">
                            Task {idx + 1}: {task.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                            +{task.points} PTS
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    </div>

                    {completed && (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                        ✓ COMPLETED
                      </span>
                    )}
                  </div>

                  {/* Expected outcome box */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Objective:</span>
                    <span className="text-cyan-300">{task.objective}</span>
                  </div>

                  {/* Hint Toggle & Solution Drawer */}
                  <div className="mt-3 pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => toggleHint(task.id)}
                      className="self-start flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isHintOpen ? 'Hide Hints & Solution' : 'Need a hint or solution?'}</span>
                      {isHintOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {isHintOpen && (
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2.5 animate-in fade-in">
                        {task.hints.map((hint, hIdx) => (
                          <div key={hIdx} className="text-slate-300">
                            <span className="text-amber-400 font-semibold font-mono mr-1">Hint {hIdx + 1}:</span>
                            <span>{hint}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-slate-800 text-slate-400">
                          <span className="text-cyan-400 font-semibold font-mono block mb-1">Explanation:</span>
                          <p>{task.solutionExplanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
