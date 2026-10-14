'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { LabModule, LabTask, LabProgress, LabValidationContext } from '@/types/labs';
import { LFHP_CURRICULUM } from '@/lib/labs/curriculum';
import { ProgressStore } from '@/lib/labs/progress-store';
import { LabValidator } from '@/lib/labs/validator';
import { useVFS } from './VFSContext';
import { SoundEffects } from '@/lib/sounds/sound-effects';

interface LabContextType {
  curriculum: LabModule[];
  progress: LabProgress;
  activeModule: LabModule;
  activeTask: LabTask;
  completedTasksCount: number;
  totalTasksCount: number;
  percentComplete: number;
  setActiveModuleId: (id: string) => void;
  setActiveTaskId: (id: string) => void;
  validateCurrentTask: (lastCommand?: string, lastStdout?: string) => Promise<boolean>;
  resetAllProgress: () => void;
  importProgress: (imported: Partial<LabProgress>) => void;
  isTaskCompleted: (taskId: string) => boolean;
  isModuleCompleted: (moduleId: string) => boolean;
  showSuccessToast: boolean;
  lastCompletedTaskTitle: string | null;
  dismissToast: () => void;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { vfsState, cwd } = useVFS();
  const [curriculum] = useState<LabModule[]>(LFHP_CURRICULUM);
  const [progress, setProgress] = useState<LabProgress>(ProgressStore.getInitialProgress());
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastCompletedTaskTitle, setLastCompletedTaskTitle] = useState<string | null>(null);

  useEffect(() => {
    const loaded = ProgressStore.loadProgress();
    setProgress(loaded);
  }, []);

  const totalTasksCount = curriculum.reduce((acc, mod) => acc + mod.tasks.length, 0);
  const completedTasksCount = progress.completedTaskIds.length;
  const percentComplete = Math.round((completedTasksCount / totalTasksCount) * 100);

  const activeModule = curriculum.find(m => m.id === progress.currentModuleId) || curriculum[0];
  const activeTask = activeModule.tasks.find(t => t.id === progress.currentTaskId) || activeModule.tasks[0];

  const isTaskCompleted = useCallback((taskId: string) => {
    return progress.completedTaskIds.includes(taskId);
  }, [progress.completedTaskIds]);

  const isModuleCompleted = useCallback((moduleId: string) => {
    const mod = curriculum.find(m => m.id === moduleId);
    if (!mod) return false;
    return mod.tasks.every(t => progress.completedTaskIds.includes(t.id));
  }, [curriculum, progress.completedTaskIds]);

  const triggerCelebration = (task: LabTask) => {
    SoundEffects.playTaskSuccess();
    setLastCompletedTaskTitle(task.title);
    setShowSuccessToast(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#00f0ff', '#10b981', '#3b82f6', '#f59e0b'],
      });
    } catch {
      // Ignore
    }
  };

  const validateCurrentTask = useCallback(async (lastCommand?: string, lastStdout?: string): Promise<boolean> => {
    if (lastCommand) {
      setCommandHistory(prev => [...prev, lastCommand]);
    }

    if (isTaskCompleted(activeTask.id)) {
      return true;
    }

    const validationCtx: LabValidationContext = {
      vfs: vfsState,
      lastCommand,
      commandHistory: lastCommand ? [...commandHistory, lastCommand] : commandHistory,
      lastStdout,
      cwd,
    };

    const isValid = await LabValidator.validateTask(activeTask, validationCtx);

    if (isValid) {
      const updatedTaskIds = [...progress.completedTaskIds, activeTask.id];
      const newScore = progress.totalScore + activeTask.points;

      // Check if current module is completed
      const modAllDone = activeModule.tasks.every(t => updatedTaskIds.includes(t.id));
      const updatedModuleIds = modAllDone && !progress.completedModuleIds.includes(activeModule.id)
        ? [...progress.completedModuleIds, activeModule.id]
        : progress.completedModuleIds;

      // Find next task
      let nextTaskId = activeTask.id;
      let nextModuleId = activeModule.id;

      const currentTaskIdx = activeModule.tasks.findIndex(t => t.id === activeTask.id);
      if (currentTaskIdx < activeModule.tasks.length - 1) {
        nextTaskId = activeModule.tasks[currentTaskIdx + 1].id;
      } else {
        const currentModIdx = curriculum.findIndex(m => m.id === activeModule.id);
        if (currentModIdx < curriculum.length - 1) {
          nextModuleId = curriculum[currentModIdx + 1].id;
          nextTaskId = curriculum[currentModIdx + 1].tasks[0].id;
        }
      }

      const newProgress: LabProgress = {
        ...progress,
        completedTaskIds: updatedTaskIds,
        completedModuleIds: updatedModuleIds,
        currentModuleId: nextModuleId,
        currentTaskId: nextTaskId,
        totalScore: newScore,
        lastActiveAt: Date.now(),
      };

      setProgress(newProgress);
      ProgressStore.saveProgress(newProgress);
      triggerCelebration(activeTask);
      return true;
    }

    return false;
  }, [activeTask, activeModule, curriculum, commandHistory, cwd, isTaskCompleted, progress, vfsState]);

  // Run validation whenever vfsState changes (e.g. file created/modified)
  useEffect(() => {
    if (activeTask && !isTaskCompleted(activeTask.id)) {
      validateCurrentTask();
    }
  }, [vfsState]);

  const setActiveModuleId = (id: string) => {
    const mod = curriculum.find(m => m.id === id);
    if (!mod) return;
    const newProgress = {
      ...progress,
      currentModuleId: id,
      currentTaskId: mod.tasks[0].id,
      lastActiveAt: Date.now(),
    };
    setProgress(newProgress);
    ProgressStore.saveProgress(newProgress);
  };

  const setActiveTaskId = (id: string) => {
    const newProgress = {
      ...progress,
      currentTaskId: id,
      lastActiveAt: Date.now(),
    };
    setProgress(newProgress);
    ProgressStore.saveProgress(newProgress);
  };

  const resetAllProgress = () => {
    const fresh = ProgressStore.resetProgress();
    setProgress(fresh);
  };

  const importProgress = (imported: Partial<LabProgress>) => {
    setProgress(prev => {
      const merged: LabProgress = {
        ...prev,
        ...imported,
        completedTaskIds: imported.completedTaskIds || prev.completedTaskIds || [],
        completedModuleIds: imported.completedModuleIds || prev.completedModuleIds || [],
        lastActiveAt: Date.now(),
      };
      ProgressStore.saveProgress(merged);
      return merged;
    });
  };

  const dismissToast = () => setShowSuccessToast(false);

  return (
    <LabContext.Provider
      value={{
        curriculum,
        progress,
        activeModule,
        activeTask,
        completedTasksCount,
        totalTasksCount,
        percentComplete,
        setActiveModuleId,
        setActiveTaskId,
        validateCurrentTask,
        resetAllProgress,
        importProgress,
        isTaskCompleted,
        isModuleCompleted,
        showSuccessToast,
        lastCompletedTaskTitle,
        dismissToast,
      }}
    >
      {children}
    </LabContext.Provider>
  );
};

export const useLab = (): LabContextType => {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
};
