import { CommandContext, CommandResult } from '@/types/terminal';
import { VFSEngine } from '@/lib/vfs/vfs-engine';
import { MAN_PAGES } from '../man-pages';

export function handleSysAdmin(ctx: CommandContext, vfs: VFSEngine, history: string[]): CommandResult | null {
  const { args, flags, rawCommand } = ctx;
  const commandName = ctx.rawCommand.trim().split(/\s+/)[0];

  switch (commandName) {
    case 'whoami': {
      return { stdout: `${vfs.getUser()}\n`, stderr: '', exitCode: 0 };
    }

    case 'id': {
      const user = vfs.getUser();
      if (user === 'root') {
        return { stdout: `uid=0(root) gid=0(root) groups=0(root)\n`, stderr: '', exitCode: 0 };
      }
      return { stdout: `uid=1000(student) gid=1000(student) groups=1000(student),4(adm),27(sudo)\n`, stderr: '', exitCode: 0 };
    }

    case 'uname': {
      const all = !!flags['a'] || !!flags['all'];
      const release = !!flags['r'];
      if (all) {
        return { stdout: `Linux evcyber 6.8.0-evcyber-lfhp #1 SMP PREEMPT_DYNAMIC EV Cyber Labs 2026 x86_64 GNU/Linux\n`, stderr: '', exitCode: 0 };
      }
      if (release) {
        return { stdout: `6.8.0-evcyber-lfhp\n`, stderr: '', exitCode: 0 };
      }
      return { stdout: `Linux\n`, stderr: '', exitCode: 0 };
    }

    case 'hostname': {
      return { stdout: `evcyber\n`, stderr: '', exitCode: 0 };
    }

    case 'date': {
      return { stdout: `${new Date().toUTCString()}\n`, stderr: '', exitCode: 0 };
    }

    case 'uptime': {
      return { stdout: ` 10:45:12 up 3:24,  1 user,  load average: 0.08, 0.03, 0.01\n`, stderr: '', exitCode: 0 };
    }

    case 'ps': {
      const aux = args.includes('aux') || !!flags['a'] || !!flags['u'] || !!flags['x'];
      if (aux) {
        const out = `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.2 169312 13540 ?        Ss   10:00   0:01 /sbin/init
root       420  0.0  0.1  14500  4200 ?        Ss   10:15   0:00 /usr/sbin/cron -f
root      1204  0.0  0.1  15800  6800 ?        Ss   10:20   0:00 sshd: /usr/sbin/sshd [listener]
www-data  1410  0.0  0.2  56200 14200 ?        S    10:35   0:00 nginx: master process /usr/sbin/nginx
student   1860  0.1  0.3  22400 18400 pts/0    Ss   10:23   0:00 -bash
student   2150  0.0  0.1  18200  8400 pts/0    R+   10:45   0:00 ps aux\n`;
        return { stdout: out, stderr: '', exitCode: 0 };
      }

      const simple = `  PID TTY          TIME CMD
 1860 pts/0    00:00:00 bash
 2151 pts/0    00:00:00 ps\n`;
      return { stdout: simple, stderr: '', exitCode: 0 };
    }

    case 'top': {
      const topOut = `top - 10:46:01 up 3:25,  1 user,  load average: 0.08, 0.03, 0.01
Tasks: 120 total,   1 running, 119 sleeping,   0 stopped,   0 zombie
%Cpu(s):  1.2 us,  0.4 sy,  0.0 ni, 98.4 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   8000.0 total,   4780.2 free,   1830.4 used,   1389.4 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   5850.1 avail Mem 

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 1410 www-data  20   0   56200  14200   8200 S   0.3   0.2   0:00.18 nginx
 1860 student   20   0   22400  18400  12000 S   0.0   0.2   0:00.22 bash
    1 root      20   0  169312  13540   9100 S   0.0   0.2   0:01.04 systemd
 1204 root      20   0   15800   6800   5200 S   0.0   0.1   0:00.05 sshd\n`;
      return { stdout: topOut, stderr: '', exitCode: 0 };
    }

    case 'kill': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ...\n', exitCode: 1 };
      }
      const pid = args.find(a => !a.startsWith('-'));
      if (pid === '1') {
        return { stdout: '', stderr: 'kill: (1) - Operation not permitted\n', exitCode: 1 };
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'chmod': {
      if (args.length < 2) {
        return { stdout: '', stderr: 'chmod: missing operand\n', exitCode: 1 };
      }
      const modeStr = args[0];
      const targets = args.slice(1);
      for (const target of targets) {
        const res = vfs.chmod(target, modeStr, vfs.getUser());
        if (!res.success) {
          return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'chown': {
      if (args.length < 2) {
        return { stdout: '', stderr: 'chown: missing operand\n', exitCode: 1 };
      }
      const ownerGroup = args[0];
      const targets = args.slice(1);
      for (const target of targets) {
        const res = vfs.chown(target, ownerGroup, vfs.getUser());
        if (!res.success) {
          return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'history': {
      let out = '';
      history.forEach((cmd, idx) => {
        out += `${(idx + 1).toString().padStart(5)}  ${cmd}\n`;
      });
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'man': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'What manual page do you want?\nFor example, try \'man ls\' or \'man grep\'\n', exitCode: 1 };
      }
      const pageName = args[0];
      const page = MAN_PAGES[pageName];
      if (!page) {
        return { stdout: '', stderr: `No manual entry for ${pageName}\n`, exitCode: 16 };
      }
      return { stdout: page + '\n', stderr: '', exitCode: 0 };
    }

    case 'env': {
      const out = Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'export': {
      if (args.length === 0) {
        return {
          stdout: Object.entries(ctx.env).map(([k, v]) => `declare -x ${k}="${v}"`).join('\n') + '\n',
          stderr: '',
          exitCode: 0,
        };
      }
      // Set variable
      for (const arg of args) {
        const [k, v] = arg.split('=');
        if (k && v !== undefined) {
          ctx.env[k] = v.replace(/^['"]|['"]$/g, '');
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'nano': {
      const targetFile = args[0] || 'untitled.txt';
      const resolved = vfs.resolvePath(targetFile);
      const existing = vfs.getNodeByPath(resolved);
      const content = existing ? existing.content : '';

      return {
        stdout: '',
        stderr: '',
        exitCode: 0,
        launchNano: {
          filePath: targetFile,
          initialContent: content,
        },
      };
    }

    case 'sudo': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'usage: sudo command\n', exitCode: 1 };
      }
      // Execute command with root privileges
      const prevUser = vfs.getUser();
      vfs.setUser('root');
      const innerCmd = args[0];
      const innerArgs = args.slice(1);
      const innerCtx: CommandContext = {
        ...ctx,
        user: 'root',
        args: innerArgs,
        rawCommand: args.join(' '),
      };
      
      // Let executor handle inner command or re-dispatch
      // Return root context execution flag
      return {
        stdout: `[sudo] user authenticated as root\n`,
        stderr: '',
        exitCode: 0,
      };
    }

    case 'base64': {
      const decode = !!flags['d'] || !!flags['decode'];
      let text = ctx.stdin || '';
      if (args.length > 0) {
        const res = vfs.readFile(args[0], vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
      }
      try {
        if (decode) {
          return { stdout: atob(text.trim()) + '\n', stderr: '', exitCode: 0 };
        } else {
          return { stdout: btoa(text) + '\n', stderr: '', exitCode: 0 };
        }
      } catch {
        return { stdout: '', stderr: 'base64: invalid input\n', exitCode: 1 };
      }
    }

    default:
      return null;
  }
}
