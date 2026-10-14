import { CommandContext, CommandResult } from '@/types/terminal';
import { VFSEngine } from '@/lib/vfs/vfs-engine';
import { modeToPermissionsString } from '@/lib/vfs/vfs-permissions';
import { BashScriptEngine } from '../bash-script-engine';

export function handleFileOps(ctx: CommandContext, vfs: VFSEngine): CommandResult | null {
  const { rawCommand, args, flags, stdin } = ctx;
  const cmd = ctx.args[0] ? '' : ''; // will match on command name
  const commandName = ctx.rawCommand.trim().split(/\s+/)[0];

  switch (commandName) {
    case 'pwd': {
      return {
        stdout: vfs.getCwd() + '\n',
        stderr: '',
        exitCode: 0,
      };
    }

    case 'cd': {
      const targetPath = args[0] || '~';
      const res = vfs.setCwd(targetPath);
      if (!res.success) {
        return {
          stdout: '',
          stderr: res.error + '\n',
          exitCode: 1,
        };
      }
      return {
        stdout: '',
        stderr: '',
        exitCode: 0,
        newCwd: res.data,
      };
    }

    case 'ls': {
      const showAll = !!flags['a'] || !!flags['all'];
      const longFormat = !!flags['l'];
      const human = !!flags['h'] || !!flags['human-readable'];
      const recursive = !!flags['R'] || !!flags['recursive'];

      const targetPath = args[0] || vfs.getCwd();
      const res = vfs.listDirectory(targetPath, vfs.getUser());

      if (!res.success) {
        return {
          stdout: '',
          stderr: res.error + '\n',
          exitCode: 2,
        };
      }

      let nodes = res.data || [];
      if (!showAll) {
        nodes = nodes.filter(n => !n.name.startsWith('.'));
      }

      if (longFormat) {
        let totalSize = nodes.reduce((acc, n) => acc + (n.type === 'directory' ? 4 : Math.ceil(n.size / 1024)), 0);
        let out = `total ${totalSize}\n`;

        for (const n of nodes) {
          const perm = modeToPermissionsString(n.mode, n.type);
          const links = n.type === 'directory' ? '2' : '1';
          const owner = n.owner.padEnd(8);
          const group = n.group.padEnd(8);
          const size = human ? (n.size < 1024 ? `${n.size}B` : `${(n.size / 1024).toFixed(1)}K`) : n.size.toString().padStart(6);
          const date = new Date(n.modifiedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
          const nameColor = n.type === 'directory' ? `\x1b[1;34m${n.name}\x1b[0m` : n.mode & 0o100 ? `\x1b[1;32m${n.name}\x1b[0m` : n.name;
          out += `${perm} ${links} ${owner} ${group} ${size} ${date} ${nameColor}\n`;
        }
        return { stdout: out, stderr: '', exitCode: 0 };
      }

      // Short format
      const names = nodes.map(n => {
        if (n.type === 'directory') return `\x1b[1;34m${n.name}\x1b[0m`;
        if (n.mode & 0o100) return `\x1b[1;32m${n.name}\x1b[0m`;
        return n.name;
      });

      return {
        stdout: names.length > 0 ? names.join('  ') + '\n' : '',
        stderr: '',
        exitCode: 0,
      };
    }

    case 'mkdir': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'mkdir: missing operand\n', exitCode: 1 };
      }
      const recursive = !!flags['p'] || !!flags['parents'];
      for (const target of args) {
        const res = vfs.createDirectory(target, vfs.getUser(), recursive);
        if (!res.success) {
          return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'rmdir': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'rmdir: missing operand\n', exitCode: 1 };
      }
      for (const target of args) {
        const res = vfs.deleteNode(target, vfs.getUser(), false);
        if (!res.success) {
          return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'touch': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'touch: missing file operand\n', exitCode: 1 };
      }
      for (const target of args) {
        const res = vfs.touch(target, vfs.getUser());
        if (!res.success) {
          return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'cat': {
      const showNumbers = !!flags['n'] || !!flags['number'];
      if (args.length === 0) {
        if (stdin) {
          let out = stdin;
          if (showNumbers) {
            out = out.split('\n').map((l, i) => `${(i + 1).toString().padStart(6)}  ${l}`).join('\n');
          }
          return { stdout: out, stderr: '', exitCode: 0 };
        }
        return { stdout: '', stderr: 'cat: missing file operand\n', exitCode: 1 };
      }

      let totalOut = '';
      for (const file of args) {
        const res = vfs.readFile(file, vfs.getUser());
        if (!res.success) {
          return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        }
        let content = res.data || '';
        if (showNumbers) {
          content = content.split('\n').map((l, i) => `${(i + 1).toString().padStart(6)}  ${l}`).join('\n');
        }
        totalOut += content;
      }
      if (totalOut && !totalOut.endsWith('\n')) totalOut += '\n';
      return { stdout: totalOut, stderr: '', exitCode: 0 };
    }

    case 'head': {
      const count = typeof flags['n'] === 'string' ? parseInt(flags['n'], 10) : 10;
      let text = stdin || '';
      if (args.length > 0) {
        const res = vfs.readFile(args[0], vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
      }
      const lines = text.split('\n').slice(0, count).join('\n');
      return { stdout: lines + (lines ? '\n' : ''), stderr: '', exitCode: 0 };
    }

    case 'tail': {
      const count = typeof flags['n'] === 'string' ? parseInt(flags['n'], 10) : 10;
      let text = stdin || '';
      if (args.length > 0) {
        const res = vfs.readFile(args[0], vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
      }
      const allLines = text.split('\n').filter(Boolean);
      const lines = allLines.slice(-count).join('\n');
      return { stdout: lines + (lines ? '\n' : ''), stderr: '', exitCode: 0 };
    }

    case 'cp': {
      const recursive = !!flags['r'] || !!flags['R'] || !!flags['recursive'];
      if (args.length < 2) {
        return { stdout: '', stderr: 'cp: missing destination file operand\n', exitCode: 1 };
      }
      const src = args[0];
      const dest = args[1];
      const res = vfs.copyNode(src, dest, vfs.getUser(), recursive);
      if (!res.success) {
        return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'mv': {
      if (args.length < 2) {
        return { stdout: '', stderr: 'mv: missing destination file operand\n', exitCode: 1 };
      }
      const src = args[0];
      const dest = args[1];
      const res = vfs.moveNode(src, dest, vfs.getUser());
      if (!res.success) {
        return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'rm': {
      const recursive = !!flags['r'] || !!flags['R'] || !!flags['recursive'];
      const force = !!flags['f'] || !!flags['force'];
      if (args.length === 0) {
        return { stdout: '', stderr: 'rm: missing operand\n', exitCode: 1 };
      }
      for (const target of args) {
        const res = vfs.deleteNode(target, vfs.getUser(), recursive);
        if (!res.success && !force) {
          return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'echo': {
      const isEscape = !!flags['e'];
      const noNewline = !!flags['n'];
      let text = args.join(' ');

      if (isEscape) {
        text = text
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\e\[/g, '\x1b[')
          .replace(/\\033\[/g, '\x1b[');
      }

      return {
        stdout: text + (noNewline ? '' : '\n'),
        stderr: '',
        exitCode: 0,
      };
    }

    case 'pwd': {
      return {
        stdout: `${vfs.getCwd()}\n`,
        stderr: '',
        exitCode: 0,
      };
    }

    case 'read': {
      const promptText = typeof flags['p'] === 'string' ? flags['p'] : '';
      const isSilent = typeof flags['s'] === 'boolean' || typeof flags['s'] === 'string';
      const varNames = args.length > 0 ? args : ['REPLY'];

      return {
        stdout: '',
        stderr: '',
        exitCode: 0,
        interactivePrompt: {
          prompt: promptText,
          isSilent,
          variableNames: varNames,
        },
      };
    }

    case 'test':
    case '[': {
      const condStr = rawCommand;
      const isTrue = BashScriptEngine.evaluateCondition(condStr, ctx.env, vfs);
      return {
        stdout: '',
        stderr: '',
        exitCode: isTrue ? 0 : 1,
      };
    }

    case 'expr': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'expr: missing operand\n', exitCode: 2 };
      }
      const exprStr = args.join(' ');
      const val = BashScriptEngine.evaluateArithmetic(exprStr, ctx.env);
      return {
        stdout: `${val}\n`,
        stderr: '',
        exitCode: 0,
      };
    }

    case 'export': {
      if (args.length === 0) {
        // Print exported variables
        const lines = Object.entries(ctx.env)
          .map(([k, v]) => `declare -x ${k}="${v}"`)
          .join('\n');
        return { stdout: lines + '\n', stderr: '', exitCode: 0 };
      }
      for (const arg of args) {
        if (arg.includes('=')) {
          const [k, ...vParts] = arg.split('=');
          const v = vParts.join('=').replace(/^['"]|['"]$/g, '');
          ctx.env[k] = v;
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'unset': {
      for (const arg of args) {
        delete ctx.env[arg];
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'printf': {
      let format = args[0] || '';
      let values = args.slice(1);
      format = format
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\e\[/g, '\x1b[');

      // Simple %s and %d interpolation
      let valIdx = 0;
      format = format.replace(/%[sd]/g, () => {
        const v = values[valIdx++];
        return v !== undefined ? v : '';
      });

      return { stdout: format, stderr: '', exitCode: 0 };
    }

    case 'clear': {
      return { stdout: '', stderr: '', exitCode: 0, clearTerminal: true };
    }

    default:
      return null;
  }
}
