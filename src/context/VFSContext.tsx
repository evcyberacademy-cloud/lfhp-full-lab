'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { VFSState, VFSNode, VFSOperationResult } from '@/types/vfs';
import { VFSEngine } from '@/lib/vfs/vfs-engine';
import { VFSStorageManager } from '@/lib/vfs/vfs-storage';
import { createInitialVFS } from '@/lib/vfs/vfs-init';
import { CommandExecutor } from '@/lib/terminal/executor';
import { CommandResult, InteractivePromptState } from '@/types/terminal';

interface VFSContextType {
  vfsState: VFSState;
  vfsEngine: VFSEngine | null;
  isLoading: boolean;
  executeCommand: (command: string) => Promise<CommandResult>;
  resumeScript: (input: string, promptState?: InteractivePromptState) => Promise<CommandResult>;
  createFile: (path: string, content?: string) => VFSOperationResult<VFSNode>;
  createDirectory: (path: string, recursive?: boolean) => VFSOperationResult<VFSNode>;
  readFile: (path: string) => VFSOperationResult<string>;
  writeFile: (path: string, content: string, append?: boolean) => VFSOperationResult<VFSNode>;
  deleteNode: (path: string, recursive?: boolean) => VFSOperationResult<void>;
  resetVFS: () => Promise<void>;
  refreshVFS: () => void;
  cwd: string;
}

const VFSContext = createContext<VFSContextType | undefined>(undefined);

export const VFSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vfsState, setVfsState] = useState<VFSState>(createInitialVFS());
  const [isLoading, setIsLoading] = useState(true);
  const engineRef = useRef<VFSEngine | null>(null);
  const executorRef = useRef<CommandExecutor | null>(null);

  const syncStateAndSave = useCallback((engine: VFSEngine) => {
    const newState = { ...engine.getState() };
    setVfsState(newState);
    VFSStorageManager.saveVFS(newState);
  }, []);

  // Initialize from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const loadedState = await VFSStorageManager.loadVFS();
        if (isMounted) {
          const engine = new VFSEngine(loadedState, 'student');
          engineRef.current = engine;
          executorRef.current = new CommandExecutor(engine);
          setVfsState(loadedState);
        }
      } catch (err) {
        console.error('Error loading VFS:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, []);

  const executeCommand = useCallback(async (cmd: string): Promise<CommandResult> => {
    if (!executorRef.current || !engineRef.current) {
      return { stdout: '', stderr: 'VFS Engine initializing...\n', exitCode: 1 };
    }

    const result = await executorRef.current.execute(cmd);
    syncStateAndSave(engineRef.current);
    return result;
  }, [syncStateAndSave]);

  const resumeScript = useCallback(async (input: string, promptState?: InteractivePromptState): Promise<CommandResult> => {
    if (!executorRef.current || !engineRef.current) {
      return { stdout: '', stderr: 'VFS Engine initializing...\n', exitCode: 1 };
    }

    const result = await executorRef.current.resumeScript(input, promptState);
    syncStateAndSave(engineRef.current);
    return result;
  }, [syncStateAndSave]);

  const createFile = useCallback((path: string, content = ''): VFSOperationResult<VFSNode> => {
    if (!engineRef.current) return { success: false, error: 'VFS not ready' };
    const res = engineRef.current.writeFile(path, content);
    if (res.success) syncStateAndSave(engineRef.current);
    return res;
  }, [syncStateAndSave]);

  const createDirectory = useCallback((path: string, recursive = false): VFSOperationResult<VFSNode> => {
    if (!engineRef.current) return { success: false, error: 'VFS not ready' };
    const res = engineRef.current.createDirectory(path, engineRef.current.getUser(), recursive);
    if (res.success) syncStateAndSave(engineRef.current);
    return res;
  }, [syncStateAndSave]);

  const readFile = useCallback((path: string): VFSOperationResult<string> => {
    if (!engineRef.current) return { success: false, error: 'VFS not ready' };
    return engineRef.current.readFile(path);
  }, []);

  const writeFile = useCallback((path: string, content: string, append = false): VFSOperationResult<VFSNode> => {
    if (!engineRef.current) return { success: false, error: 'VFS not ready' };
    const res = engineRef.current.writeFile(path, content, engineRef.current.getUser(), append);
    if (res.success) syncStateAndSave(engineRef.current);
    return res;
  }, [syncStateAndSave]);

  const deleteNode = useCallback((path: string, recursive = false): VFSOperationResult<void> => {
    if (!engineRef.current) return { success: false, error: 'VFS not ready' };
    const res = engineRef.current.deleteNode(path, engineRef.current.getUser(), recursive);
    if (res.success) syncStateAndSave(engineRef.current);
    return res;
  }, [syncStateAndSave]);

  const resetVFS = useCallback(async () => {
    const fresh = await VFSStorageManager.resetVFS();
    if (engineRef.current) {
      engineRef.current.setState(fresh);
      executorRef.current = new CommandExecutor(engineRef.current);
    }
    setVfsState(fresh);
  }, []);

  const refreshVFS = useCallback(() => {
    if (engineRef.current) {
      setVfsState({ ...engineRef.current.getState() });
    }
  }, []);

  return (
    <VFSContext.Provider
      value={{
        vfsState,
        vfsEngine: engineRef.current,
        isLoading,
        executeCommand,
        resumeScript,
        createFile,
        createDirectory,
        readFile,
        writeFile,
        deleteNode,
        resetVFS,
        refreshVFS,
        cwd: engineRef.current?.getCwd() || '/home/student',
      }}
    >
      {children}
    </VFSContext.Provider>
  );
};

export const useVFS = (): VFSContextType => {
  const context = useContext(VFSContext);
  if (!context) {
    throw new Error('useVFS must be used within a VFSProvider');
  }
  return context;
};
