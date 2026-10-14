export type OutputType = 'stdout' | 'stderr' | 'system' | 'prompt' | 'info' | 'success' | 'warn' | 'error';

export interface TerminalOutputLine {
  id: string;
  type: OutputType;
  content: string;
  timestamp: number;
}

export interface CommandContext {
  cwd: string;
  user: string;
  hostname: string;
  env: Record<string, string>;
  stdin?: string;
  args: string[];
  flags: Record<string, string | boolean>;
  rawCommand: string;
}

export interface InteractivePromptState {
  prompt: string;
  isSilent?: boolean;
  variableNames: string[];
  remainingScriptLines?: string[];
  scriptEnv?: Record<string, string>;
  scriptName?: string;
  scriptArgs?: string[];
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  newCwd?: string;
  clearTerminal?: boolean;
  launchNano?: {
    filePath: string;
    initialContent: string;
  };
  launchApp?: string; // e.g. 'lab-center', 'browser', 'settings'
  interactivePrompt?: InteractivePromptState;
}

export interface ParsedPipelineStage {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  redirectOut?: {
    file: string;
    append: boolean;
  };
  redirectIn?: {
    file: string;
  };
}

export interface ParsedCommandLine {
  stages: ParsedPipelineStage[];
  raw: string;
}

export interface NanoState {
  isActive: boolean;
  filePath: string;
  content: string[];
  cursorRow: number;
  cursorCol: number;
  statusMessage: string;
  isModified: boolean;
}
