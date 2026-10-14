import { LabProgress } from '@/types/labs';
import { LFHP_CURRICULUM } from './curriculum';

const PROGRESS_STORAGE_KEY = 'evcyber_lfhp_progress_v1';

export class ProgressStore {
  public static getInitialProgress(): LabProgress {
    return {
      completedTaskIds: [],
      completedModuleIds: [],
      currentModuleId: LFHP_CURRICULUM[0].id,
      currentTaskId: LFHP_CURRICULUM[0].tasks[0].id,
      totalScore: 0,
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
    };
  }

  public static loadProgress(): LabProgress {
    if (typeof window === 'undefined') return this.getInitialProgress();
    try {
      const data = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Ignore
    }
    return this.getInitialProgress();
  }

  public static saveProgress(progress: LabProgress): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore
    }
  }

  public static resetProgress(): LabProgress {
    const initial = this.getInitialProgress();
    this.saveProgress(initial);
    return initial;
  }
}
