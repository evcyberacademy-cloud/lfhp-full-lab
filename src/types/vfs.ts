export type FileType = 'file' | 'directory' | 'symlink' | 'device';

export interface VFSNode {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null;
  path: string;
  content: string; // text content for files, target path for symlinks
  size: number;
  mode: number; // octal permission e.g. 0o755, 0o644
  owner: string; // e.g. 'student', 'root'
  group: string; // e.g. 'student', 'root', 'sudo'
  createdAt: number;
  modifiedAt: number;
  isLocked?: boolean; // system files protected from accidental corruption
  isProc?: boolean; // dynamically computed /proc node
}

export interface VFSState {
  nodes: Record<string, VFSNode>;
  rootId: string;
  currentDirectory: string; // current working directory e.g. '/home/student'
  version: number;
}

export interface VFSStat {
  id: string;
  name: string;
  type: FileType;
  path: string;
  size: number;
  mode: number;
  permissionsString: string; // e.g. -rwxr-xr-x
  owner: string;
  group: string;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
}

export interface VFSOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
