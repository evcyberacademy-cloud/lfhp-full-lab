import { VFSNode, FileType } from '@/types/vfs';

export function modeToPermissionsString(mode: number, type: FileType): string {
  const typeChar = type === 'directory' ? 'd' : type === 'symlink' ? 'l' : type === 'device' ? 'c' : '-';
  
  const userRead = (mode & 0o400) ? 'r' : '-';
  const userWrite = (mode & 0o200) ? 'w' : '-';
  const userExec = (mode & 0o100) ? 'x' : '-';
  
  const groupRead = (mode & 0o040) ? 'r' : '-';
  const groupWrite = (mode & 0o020) ? 'w' : '-';
  const groupExec = (mode & 0o010) ? 'x' : '-';
  
  const otherRead = (mode & 0o004) ? 'r' : '-';
  const otherWrite = (mode & 0o002) ? 'w' : '-';
  const otherExec = (mode & 0o001) ? 'x' : '-';
  
  return `${typeChar}${userRead}${userWrite}${userExec}${groupRead}${groupWrite}${groupExec}${otherRead}${otherWrite}${otherExec}`;
}

export function parseOctalMode(modeStr: string, currentMode: number = 0o644): number | null {
  // If numeric octal like "755", "0755", "644"
  if (/^0?[0-7]{3,4}$/.test(modeStr)) {
    return parseInt(modeStr, 8);
  }
  
  // Symbolic mode like "+x", "u+rwx", "go-w", "a+r"
  let newMode = currentMode;
  const match = modeStr.match(/^([ugoa]*)([\+\-\=])([rwxXstugo]+)$/);
  if (match) {
    const [, who, op, perm] = match;
    const targets = who === '' || who === 'a' ? ['u', 'g', 'o'] : who.split('');
    
    let mask = 0;
    if (perm.includes('r')) mask |= 0o4;
    if (perm.includes('w')) mask |= 0o2;
    if (perm.includes('x')) mask |= 0o1;
    
    targets.forEach(t => {
      let shift = t === 'u' ? 6 : t === 'g' ? 3 : 0;
      let targetMask = mask << shift;
      
      if (op === '+') {
        newMode |= targetMask;
      } else if (op === '-') {
        newMode &= ~targetMask;
      } else if (op === '=') {
        let clearMask = 0o7 << shift;
        newMode = (newMode & ~clearMask) | targetMask;
      }
    });
    return newMode;
  }
  
  return null;
}

export function canAccess(
  node: VFSNode,
  requiredMode: 'r' | 'w' | 'x',
  user: string = 'student',
  groups: string[] = ['student', 'sudo']
): boolean {
  if (user === 'root') return true; // root has full access
  
  const isOwner = node.owner === user;
  const isGroup = groups.includes(node.group);
  
  let allowed = false;
  
  if (isOwner) {
    if (requiredMode === 'r') allowed = !!(node.mode & 0o400);
    if (requiredMode === 'w') allowed = !!(node.mode & 0o200);
    if (requiredMode === 'x') allowed = !!(node.mode & 0o100);
  } else if (isGroup) {
    if (requiredMode === 'r') allowed = !!(node.mode & 0o040);
    if (requiredMode === 'w') allowed = !!(node.mode & 0o020);
    if (requiredMode === 'x') allowed = !!(node.mode & 0o010);
  } else {
    if (requiredMode === 'r') allowed = !!(node.mode & 0o004);
    if (requiredMode === 'w') allowed = !!(node.mode & 0o002);
    if (requiredMode === 'x') allowed = !!(node.mode & 0o001);
  }
  
  return allowed;
}
