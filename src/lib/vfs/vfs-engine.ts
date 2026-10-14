import { VFSNode, VFSState, VFSStat, VFSOperationResult, FileType } from '@/types/vfs';
import { modeToPermissionsString, parseOctalMode, canAccess } from './vfs-permissions';

export class VFSEngine {
  private state: VFSState;
  private currentUser: string = 'student';
  private currentGroups: string[] = ['student', 'sudo'];

  constructor(initialState: VFSState, currentUser = 'student') {
    this.state = JSON.parse(JSON.stringify(initialState));
    this.currentUser = currentUser;
  }

  public getState(): VFSState {
    return this.state;
  }

  public setState(state: VFSState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  public setUser(user: string): void {
    this.currentUser = user;
    this.currentGroups = user === 'root' ? ['root', 'sudo'] : ['student', 'sudo'];
  }

  public getUser(): string {
    return this.currentUser;
  }

  public getCwd(): string {
    return this.state.currentDirectory;
  }

  public setCwd(path: string): VFSOperationResult<string> {
    const resolved = this.resolvePath(path);
    const node = this.getNodeByPath(resolved);
    
    if (!node) {
      return { success: false, error: `cd: ${path}: No such file or directory` };
    }
    if (node.type !== 'directory') {
      return { success: false, error: `cd: ${path}: Not a directory` };
    }
    if (!canAccess(node, 'x', this.currentUser, this.currentGroups)) {
      return { success: false, error: `cd: ${path}: Permission denied` };
    }

    this.state.currentDirectory = resolved;
    return { success: true, data: resolved };
  }

  public normalizePath(path: string): string {
    if (!path) return '/';
    let p = path.trim();
    
    // Replace ~ with /home/student
    if (p === '~') return '/home/student';
    if (p.startsWith('~/')) p = '/home/student/' + p.slice(2);

    // If relative, prepend cwd
    if (!p.startsWith('/')) {
      p = this.state.currentDirectory === '/' ? `/${p}` : `${this.state.currentDirectory}/${p}`;
    }

    const segments = p.split('/').filter(Boolean);
    const resolvedSegments: string[] = [];

    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        if (resolvedSegments.length > 0) resolvedSegments.pop();
      } else {
        resolvedSegments.push(seg);
      }
    }

    return '/' + resolvedSegments.join('/');
  }

  public resolvePath(path: string): string {
    return this.normalizePath(path);
  }

  public getNodeByPath(path: string): VFSNode | null {
    const normalized = this.normalizePath(path);
    if (normalized === '/') {
      return this.state.nodes[this.state.rootId] || null;
    }

    const segments = normalized.split('/').filter(Boolean);
    let currentId = this.state.rootId;

    for (const seg of segments) {
      const children = this.getChildren(currentId);
      const match = children.find(c => c.name === seg);
      if (!match) return null;
      currentId = match.id;
    }

    const node = this.state.nodes[currentId];
    if (!node) return null;

    // If it's a dynamic /proc node, update content
    if (node.isProc) {
      return this.getDynamicProcNode(node);
    }

    return node;
  }

  private getDynamicProcNode(node: VFSNode): VFSNode {
    const now = Date.now();
    if (node.name === 'uptime') {
      const uptimeSec = Math.floor(performance.now() / 1000) + 3600;
      return {
        ...node,
        content: `${uptimeSec}.42 ${(uptimeSec * 1.8).toFixed(2)}\n`,
        modifiedAt: now,
      };
    }
    return node;
  }

  public getChildren(parentId: string): VFSNode[] {
    return Object.values(this.state.nodes).filter(n => n.parentId === parentId);
  }

  public listDirectory(path: string = this.state.currentDirectory, user = this.currentUser): VFSOperationResult<VFSNode[]> {
    const resolved = this.resolvePath(path);
    const node = this.getNodeByPath(resolved);

    if (!node) {
      return { success: false, error: `ls: cannot access '${path}': No such file or directory` };
    }
    if (node.type !== 'directory') {
      return { success: true, data: [node] };
    }
    if (!canAccess(node, 'r', user, this.currentGroups)) {
      return { success: false, error: `ls: cannot open directory '${path}': Permission denied` };
    }

    const children = this.getChildren(node.id).sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });

    return { success: true, data: children };
  }

  public readFile(path: string, user = this.currentUser): VFSOperationResult<string> {
    const resolved = this.resolvePath(path);
    const node = this.getNodeByPath(resolved);

    if (!node) {
      return { success: false, error: `cat: ${path}: No such file or directory` };
    }
    if (node.type === 'directory') {
      return { success: false, error: `cat: ${path}: Is a directory` };
    }
    if (!canAccess(node, 'r', user, this.currentGroups)) {
      return { success: false, error: `cat: ${path}: Permission denied` };
    }

    return { success: true, data: node.content };
  }

  public writeFile(path: string, content: string, user = this.currentUser, append = false): VFSOperationResult<VFSNode> {
    const resolved = this.resolvePath(path);
    const existing = this.getNodeByPath(resolved);

    if (existing) {
      if (existing.type === 'directory') {
        return { success: false, error: `${path}: Is a directory` };
      }
      if (!canAccess(existing, 'w', user, this.currentGroups)) {
        return { success: false, error: `${path}: Permission denied` };
      }

      existing.content = append ? existing.content + content : content;
      existing.size = existing.content.length;
      existing.modifiedAt = Date.now();
      return { success: true, data: existing };
    }

    // Create new file
    const parentPath = resolved.substring(0, resolved.lastIndexOf('/')) || '/';
    const fileName = resolved.substring(resolved.lastIndexOf('/') + 1);
    const parentNode = this.getNodeByPath(parentPath);

    if (!parentNode) {
      return { success: false, error: `cannot create file '${path}': No such file or directory` };
    }
    if (parentNode.type !== 'directory') {
      return { success: false, error: `cannot create file '${path}': Not a directory` };
    }
    if (!canAccess(parentNode, 'w', user, this.currentGroups)) {
      return { success: false, error: `cannot create file '${path}': Permission denied` };
    }

    const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newNode: VFSNode = {
      id,
      name: fileName,
      type: 'file',
      parentId: parentNode.id,
      path: resolved,
      content,
      size: content.length,
      mode: 0o644,
      owner: user,
      group: user,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };

    this.state.nodes[id] = newNode;
    return { success: true, data: newNode };
  }

  public createDirectory(path: string, user = this.currentUser, recursive = false, mode = 0o755): VFSOperationResult<VFSNode> {
    const resolved = this.resolvePath(path);
    if (this.getNodeByPath(resolved)) {
      return { success: false, error: `mkdir: cannot create directory '${path}': File exists` };
    }

    const segments = resolved.split('/').filter(Boolean);
    let currentPath = '';
    let currentParentId = this.state.rootId;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      currentPath += '/' + seg;
      const existing = this.getNodeByPath(currentPath);

      if (existing) {
        if (existing.type !== 'directory') {
          return { success: false, error: `mkdir: cannot create directory '${path}': Not a directory` };
        }
        currentParentId = existing.id;
      } else {
        if (i < segments.length - 1 && !recursive) {
          return { success: false, error: `mkdir: cannot create directory '${path}': No such file or directory` };
        }

        const parentNode = this.state.nodes[currentParentId];
        if (!canAccess(parentNode, 'w', user, this.currentGroups)) {
          return { success: false, error: `mkdir: cannot create directory '${path}': Permission denied` };
        }

        const id = `dir_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newDir: VFSNode = {
          id,
          name: seg,
          type: 'directory',
          parentId: currentParentId,
          path: currentPath,
          content: '',
          size: 4096,
          mode,
          owner: user,
          group: user,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
        };

        this.state.nodes[id] = newDir;
        currentParentId = id;
      }
    }

    const finalNode = this.getNodeByPath(resolved);
    return { success: true, data: finalNode || undefined };
  }

  public touch(path: string, user = this.currentUser): VFSOperationResult<VFSNode> {
    const resolved = this.resolvePath(path);
    const existing = this.getNodeByPath(resolved);

    if (existing) {
      existing.modifiedAt = Date.now();
      return { success: true, data: existing };
    }

    return this.writeFile(path, '', user);
  }

  public deleteNode(path: string, user = this.currentUser, recursive = false): VFSOperationResult<void> {
    const resolved = this.resolvePath(path);
    if (resolved === '/') {
      return { success: false, error: 'rm: cannot remove root directory' };
    }

    const node = this.getNodeByPath(resolved);
    if (!node) {
      return { success: false, error: `rm: cannot remove '${path}': No such file or directory` };
    }

    if (node.isLocked && user !== 'root') {
      return { success: false, error: `rm: cannot remove '${path}': Operation not permitted (protected system resource)` };
    }

    const parentNode = node.parentId ? this.state.nodes[node.parentId] : null;
    if (parentNode && !canAccess(parentNode, 'w', user, this.currentGroups)) {
      return { success: false, error: `rm: cannot remove '${path}': Permission denied` };
    }

    if (node.type === 'directory') {
      const children = this.getChildren(node.id);
      if (children.length > 0 && !recursive) {
        return { success: false, error: `rm: cannot remove '${path}': Is a directory` };
      }

      // Recursively delete children
      const deleteRecursive = (id: string) => {
        const cList = this.getChildren(id);
        for (const c of cList) {
          if (c.type === 'directory') deleteRecursive(c.id);
          delete this.state.nodes[c.id];
        }
      };
      deleteRecursive(node.id);
    }

    delete this.state.nodes[node.id];
    return { success: true };
  }

  public copyNode(srcPath: string, destPath: string, user = this.currentUser, recursive = false): VFSOperationResult<void> {
    const srcResolved = this.resolvePath(srcPath);
    const srcNode = this.getNodeByPath(srcResolved);

    if (!srcNode) {
      return { success: false, error: `cp: cannot stat '${srcPath}': No such file or directory` };
    }

    if (srcNode.type === 'directory' && !recursive) {
      return { success: false, error: `cp: -r not specified; omitting directory '${srcPath}'` };
    }

    let destResolved = this.resolvePath(destPath);
    const destNode = this.getNodeByPath(destResolved);

    if (destNode && destNode.type === 'directory') {
      destResolved = destResolved === '/' ? `/${srcNode.name}` : `${destResolved}/${srcNode.name}`;
    }

    if (srcNode.type === 'file') {
      return this.writeFile(destResolved, srcNode.content, user) as any;
    }

    // Copy directory recursive
    const createRes = this.createDirectory(destResolved, user, true, srcNode.mode);
    if (!createRes.success) return createRes as any;

    const copySubTree = (srcId: string, destParentPath: string) => {
      const children = this.getChildren(srcId);
      for (const child of children) {
        const newChildPath = `${destParentPath}/${child.name}`;
        if (child.type === 'file') {
          this.writeFile(newChildPath, child.content, user);
        } else if (child.type === 'directory') {
          this.createDirectory(newChildPath, user, true, child.mode);
          const newChildNode = this.getNodeByPath(newChildPath);
          if (newChildNode) {
            copySubTree(child.id, newChildPath);
          }
        }
      }
    };

    copySubTree(srcNode.id, destResolved);
    return { success: true };
  }

  public moveNode(srcPath: string, destPath: string, user = this.currentUser): VFSOperationResult<void> {
    const srcResolved = this.resolvePath(srcPath);
    const srcNode = this.getNodeByPath(srcResolved);

    if (!srcNode) {
      return { success: false, error: `mv: cannot stat '${srcPath}': No such file or directory` };
    }

    let destResolved = this.resolvePath(destPath);
    const destNode = this.getNodeByPath(destResolved);

    if (destNode && destNode.type === 'directory') {
      destResolved = destResolved === '/' ? `/${srcNode.name}` : `${destResolved}/${srcNode.name}`;
    }

    // Update node details
    const newParentPath = destResolved.substring(0, destResolved.lastIndexOf('/')) || '/';
    const newFileName = destResolved.substring(destResolved.lastIndexOf('/') + 1);
    const newParentNode = this.getNodeByPath(newParentPath);

    if (!newParentNode || newParentNode.type !== 'directory') {
      return { success: false, error: `mv: cannot move to '${destPath}': No such file or directory` };
    }

    if (!canAccess(newParentNode, 'w', user, this.currentGroups)) {
      return { success: false, error: `mv: cannot move to '${destPath}': Permission denied` };
    }

    srcNode.name = newFileName;
    srcNode.parentId = newParentNode.id;
    srcNode.path = destResolved;
    srcNode.modifiedAt = Date.now();

    // Update child paths if directory
    if (srcNode.type === 'directory') {
      const updateChildPaths = (parentId: string, parentPath: string) => {
        const children = this.getChildren(parentId);
        for (const child of children) {
          child.path = `${parentPath}/${child.name}`;
          if (child.type === 'directory') {
            updateChildPaths(child.id, child.path);
          }
        }
      };
      updateChildPaths(srcNode.id, destResolved);
    }

    return { success: true };
  }

  public chmod(path: string, modeStr: string, user = this.currentUser): VFSOperationResult<void> {
    const resolved = this.resolvePath(path);
    const node = this.getNodeByPath(resolved);

    if (!node) {
      return { success: false, error: `chmod: cannot access '${path}': No such file or directory` };
    }

    if (user !== 'root' && node.owner !== user) {
      return { success: false, error: `chmod: changing permissions of '${path}': Operation not permitted` };
    }

    const newMode = parseOctalMode(modeStr, node.mode);
    if (newMode === null) {
      return { success: false, error: `chmod: invalid mode: '${modeStr}'` };
    }

    node.mode = newMode;
    node.modifiedAt = Date.now();
    return { success: true };
  }

  public chown(path: string, ownerGroup: string, user = this.currentUser): VFSOperationResult<void> {
    const resolved = this.resolvePath(path);
    const node = this.getNodeByPath(resolved);

    if (!node) {
      return { success: false, error: `chown: cannot access '${path}': No such file or directory` };
    }

    if (user !== 'root') {
      return { success: false, error: `chown: changing ownership of '${path}': Operation not permitted` };
    }

    const [owner, group] = ownerGroup.split(':');
    if (owner) node.owner = owner;
    if (group) node.group = group;
    node.modifiedAt = Date.now();
    return { success: true };
  }

  public stat(path: string): VFSOperationResult<VFSStat> {
    const resolved = this.resolvePath(path);
    const node = this.getNodeByPath(resolved);

    if (!node) {
      return { success: false, error: `stat: cannot stat '${path}': No such file or directory` };
    }

    const statObj: VFSStat = {
      id: node.id,
      name: node.name,
      type: node.type,
      path: node.path,
      size: node.size,
      mode: node.mode,
      permissionsString: modeToPermissionsString(node.mode, node.type),
      owner: node.owner,
      group: node.group,
      createdAt: new Date(node.createdAt),
      modifiedAt: new Date(node.modifiedAt),
      isDirectory: node.type === 'directory',
      isFile: node.type === 'file',
      isSymlink: node.type === 'symlink',
    };

    return { success: true, data: statObj };
  }

  public find(startPath = this.state.currentDirectory, options: { namePattern?: string; type?: FileType } = {}): VFSNode[] {
    const resolved = this.resolvePath(startPath);
    const rootNode = this.getNodeByPath(resolved);
    if (!rootNode) return [];

    const results: VFSNode[] = [];
    const traverse = (node: VFSNode) => {
      let matches = true;
      if (options.type && node.type !== options.type) matches = false;
      if (options.namePattern) {
        // Convert wildcard pattern like *.txt to regex
        const regex = new RegExp('^' + options.namePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i');
        if (!regex.test(node.name)) matches = false;
      }

      if (matches) results.push(node);

      if (node.type === 'directory') {
        const children = this.getChildren(node.id);
        children.forEach(traverse);
      }
    };

    traverse(rootNode);
    return results;
  }
}
