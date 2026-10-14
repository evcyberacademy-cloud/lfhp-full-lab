import { VFSState } from './vfs';

export type LabCategory = 
  | 'linux-basics'
  | 'filesystem'
  | 'permissions'
  | 'users-processes'
  | 'text-processing'
  | 'shell-scripting'
  | 'networking'
  | 'dns-http'
  | 'port-scanning';

export interface LabValidationContext {
  vfs: VFSState;
  lastCommand?: string;
  commandHistory: string[];
  lastStdout?: string;
  cwd: string;
}

export type ValidatorFunction = (context: LabValidationContext) => boolean | Promise<boolean>;

export interface LabTask {
  id: string;
  title: string;
  description: string;
  objective: string;
  expectedOutcome: string;
  hints: string[];
  solutionExplanation: string;
  validationType: 'vfs_state' | 'command_execution' | 'file_content' | 'combined';
  validator: ValidatorFunction;
  points: number;
}

export interface LabModule {
  id: string;
  number: number;
  title: string;
  category: LabCategory;
  summary: string;
  learningObjectives: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  tasks: LabTask[];
}

export interface LabProgress {
  completedTaskIds: string[];
  completedModuleIds: string[];
  currentModuleId: string;
  currentTaskId: string;
  totalScore: number;
  startedAt: number;
  lastActiveAt: number;
}
