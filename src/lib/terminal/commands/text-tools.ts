import { CommandContext, CommandResult } from '@/types/terminal';
import { VFSEngine } from '@/lib/vfs/vfs-engine';
import { modeToPermissionsString } from '@/lib/vfs/vfs-permissions';

export function handleTextTools(ctx: CommandContext, vfs: VFSEngine): CommandResult | null {
  const { args, flags, stdin } = ctx;
  const commandName = ctx.rawCommand.trim().split(/\s+/)[0];

  switch (commandName) {
    case 'grep': {
      const ignoreCase = !!flags['i'] || !!flags['ignore-case'];
      const invertMatch = !!flags['v'] || !!flags['invert-match'];
      const showLineNumbers = !!flags['n'] || !!flags['line-number'];
      const countOnly = !!flags['c'] || !!flags['count'];

      if (args.length === 0) {
        return { stdout: '', stderr: 'Usage: grep [OPTION]... PATTERNS [FILE]...\n', exitCode: 2 };
      }

      const patternStr = args[0];
      const targetFiles = args.slice(1);

      let regex: RegExp;
      try {
        regex = new RegExp(patternStr, ignoreCase ? 'i' : '');
      } catch {
        return { stdout: '', stderr: `grep: invalid regular expression '${patternStr}'\n`, exitCode: 2 };
      }

      let linesToProcess: { file?: string; line: string; lineNum: number }[] = [];

      if (targetFiles.length === 0) {
        if (stdin !== undefined) {
          const lines = stdin.split('\n');
          linesToProcess = lines.map((l, i) => ({ line: l, lineNum: i + 1 }));
        }
      } else {
        for (const f of targetFiles) {
          const res = vfs.readFile(f, vfs.getUser());
          if (!res.success) {
            return { stdout: '', stderr: res.error + '\n', exitCode: 2 };
          }
          const fLines = (res.data || '').split('\n');
          fLines.forEach((l, i) => linesToProcess.push({ file: targetFiles.length > 1 ? f : undefined, line: l, lineNum: i + 1 }));
        }
      }

      const matched = linesToProcess.filter(item => {
        const matches = regex.test(item.line);
        return invertMatch ? !matches : matches;
      });

      if (countOnly) {
        return { stdout: `${matched.length}\n`, stderr: '', exitCode: matched.length > 0 ? 0 : 1 };
      }

      let out = '';
      for (const item of matched) {
        let prefix = '';
        if (item.file) prefix += `\x1b[35m${item.file}\x1b[0m:`;
        if (showLineNumbers) prefix += `\x1b[32m${item.lineNum}\x1b[0m:`;

        // Highlight match
        let highlighted = item.line;
        if (!invertMatch) {
          highlighted = highlighted.replace(regex, m => `\x1b[1;31m${m}\x1b[0m`);
        }
        out += `${prefix}${highlighted}\n`;
      }

      return {
        stdout: out,
        stderr: '',
        exitCode: matched.length > 0 ? 0 : 1,
      };
    }

    case 'find': {
      let startPath = '.';
      let namePattern: string | undefined;
      let type: 'file' | 'directory' | undefined;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-name' && i + 1 < args.length) {
          namePattern = args[i + 1].replace(/^['"]|['"]$/g, '');
          i++;
        } else if (args[i] === '-type' && i + 1 < args.length) {
          type = args[i + 1] === 'd' ? 'directory' : 'file';
          i++;
        } else if (!args[i].startsWith('-')) {
          startPath = args[i];
        }
      }

      const nodes = vfs.find(startPath, { namePattern, type });
      const out = nodes.map(n => n.path).join('\n') + (nodes.length > 0 ? '\n' : '');
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'which':
    case 'whereis': {
      if (args.length === 0) return { stdout: '', stderr: '', exitCode: 1 };
      let out = '';
      for (const target of args) {
        const path = `/bin/${target}`;
        const node = vfs.getNodeByPath(path);
        if (node) {
          out += commandName === 'whereis' ? `${target}: ${path}\n` : `${path}\n`;
        }
      }
      return { stdout: out, stderr: '', exitCode: out ? 0 : 1 };
    }

    case 'file': {
      if (args.length === 0) {
        return { stdout: '', stderr: 'Usage: file [FILE]...\n', exitCode: 1 };
      }
      let out = '';
      for (const target of args) {
        const node = vfs.getNodeByPath(target);
        if (!node) {
          out += `${target}: cannot open (No such file or directory)\n`;
          continue;
        }
        if (node.type === 'directory') {
          out += `${target}: directory\n`;
        } else if (node.name.endsWith('.sh')) {
          out += `${target}: POSIX shell script, ASCII text executable\n`;
        } else if (node.name.endsWith('.html')) {
          out += `${target}: HTML document, ASCII text\n`;
        } else if (node.name.endsWith('.json')) {
          out += `${target}: JSON data\n`;
        } else if (node.content.startsWith('#!')) {
          out += `${target}: script executable\n`;
        } else {
          out += `${target}: ASCII text\n`;
        }
      }
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'stat': {
      if (args.length === 0) return { stdout: '', stderr: 'stat: missing operand\n', exitCode: 1 };
      const res = vfs.stat(args[0]);
      if (!res.success || !res.data) {
        return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
      }
      const st = res.data;
      const out = `  File: ${st.name}
  Size: ${st.size}\tBlocks: ${Math.ceil(st.size / 512)}\tIO Block: 4096   ${st.isDirectory ? 'directory' : 'regular file'}
Device: 0/0\tInode: ${st.id}\tLinks: 1
Access: (${st.mode.toString(8).padStart(4, '0')}/${st.permissionsString})\tUid: ( 1000/ ${st.owner})\tGid: ( 1000/ ${st.group})
Access: ${st.modifiedAt.toISOString()}
Modify: ${st.modifiedAt.toISOString()}
Change: ${st.modifiedAt.toISOString()}
 Birth: ${st.createdAt.toISOString()}\n`;
      return { stdout: out, stderr: '', exitCode: 0 };
    }

    case 'wc': {
      const countLines = !!flags['l'] || (!flags['l'] && !flags['w'] && !flags['c']);
      const countWords = !!flags['w'] || (!flags['l'] && !flags['w'] && !flags['c']);
      const countChars = !!flags['c'] || (!flags['l'] && !flags['w'] && !flags['c']);

      let text = stdin || '';
      let fileName = '';
      if (args.length > 0) {
        const res = vfs.readFile(args[0], vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
        fileName = args[0];
      }

      const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;

      let parts: string[] = [];
      if (countLines) parts.push(lines.toString().padStart(4));
      if (countWords) parts.push(words.toString().padStart(4));
      if (countChars) parts.push(chars.toString().padStart(4));
      if (fileName) parts.push(fileName);

      return { stdout: parts.join(' ') + '\n', stderr: '', exitCode: 0 };
    }

    case 'sort': {
      const reverse = !!flags['r'];
      const numeric = !!flags['n'];
      const unique = !!flags['u'];

      let text = stdin || '';
      if (args.length > 0) {
        const res = vfs.readFile(args[0], vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
      }

      let lines = text.split('\n').filter(Boolean);
      lines.sort((a, b) => {
        if (numeric) {
          const numA = parseFloat(a) || 0;
          const numB = parseFloat(b) || 0;
          return numA - numB;
        }
        return a.localeCompare(b);
      });

      if (reverse) lines.reverse();
      if (unique) lines = Array.from(new Set(lines));

      return { stdout: lines.join('\n') + (lines.length > 0 ? '\n' : ''), stderr: '', exitCode: 0 };
    }

    case 'uniq': {
      const countOnly = !!flags['c'];
      let text = stdin || '';
      if (args.length > 0) {
        const res = vfs.readFile(args[0], vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
      }

      const lines = text.split('\n').filter(Boolean);
      const result: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        let count = 1;
        while (i + 1 < lines.length && lines[i + 1] === lines[i]) {
          count++;
          i++;
        }
        if (countOnly) {
          result.push(`${count.toString().padStart(4)} ${lines[i]}`);
        } else {
          result.push(lines[i]);
        }
      }

      return { stdout: result.join('\n') + (result.length > 0 ? '\n' : ''), stderr: '', exitCode: 0 };
    }

    case 'cut': {
      const delimiter = typeof flags['d'] === 'string' ? flags['d'] : '\t';
      const fieldStr = typeof flags['f'] === 'string' ? flags['f'] : '';

      if (!fieldStr) {
        return { stdout: '', stderr: 'cut: you must specify a list of bytes, characters, or fields\n', exitCode: 1 };
      }

      const fieldIndices = fieldStr.split(',').map(f => parseInt(f.trim(), 10) - 1).filter(n => n >= 0);

      let text = stdin || '';
      if (args.length > 0) {
        const res = vfs.readFile(args[0], vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
      }

      const lines = text.split('\n');
      const out = lines.map(line => {
        if (!line && line !== '') return '';
        const parts = line.split(delimiter);
        return fieldIndices.map(idx => parts[idx] || '').join(delimiter);
      }).join('\n');

      return { stdout: out + (out && !out.endsWith('\n') ? '\n' : ''), stderr: '', exitCode: 0 };
    }

    case 'awk': {
      if (args.length === 0 && !stdin) {
        return { stdout: '', stderr: 'Usage: awk [program] [file]\n', exitCode: 1 };
      }

      const program = args[0] || '';
      const file = args[1];

      let text = stdin || '';
      if (file) {
        const res = vfs.readFile(file, vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
      }

      // Simple awk '{print $1}' or '{print $1, $2}' simulation
      const match = program.match(/print\s+(.+)/);
      if (match) {
        const printTargets = match[1].split(/[\s,]+/).filter(Boolean);
        const lines = text.split('\n').filter(Boolean);
        const processed = lines.map(l => {
          const cols = l.trim().split(/\s+/);
          return printTargets.map(t => {
            if (t.startsWith('$')) {
              const colIdx = parseInt(t.slice(1), 10);
              if (colIdx === 0) return l;
              return cols[colIdx - 1] || '';
            }
            return t.replace(/^['"]|['"]$/g, '');
          }).join(' ');
        });
        return { stdout: processed.join('\n') + '\n', stderr: '', exitCode: 0 };
      }

      return { stdout: text, stderr: '', exitCode: 0 };
    }

    case 'sed': {
      const expr = args[0] || '';
      const file = args[1];

      let text = stdin || '';
      if (file) {
        const res = vfs.readFile(file, vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
      }

      // Handle s/find/replace/g
      const sMatch = expr.match(/^s\/([^\/]+)\/([^\/]*)\/([gip]*)$/);
      if (sMatch) {
        const [, find, replace, flag] = sMatch;
        const flagsStr = flag.includes('g') ? 'g' : '';
        const regex = new RegExp(find, flagsStr);
        const result = text.split('\n').map(l => l.replace(regex, replace)).join('\n');
        return { stdout: result + (result && !result.endsWith('\n') ? '\n' : ''), stderr: '', exitCode: 0 };
      }

      return { stdout: text, stderr: '', exitCode: 0 };
    }

    case 'less':
    case 'more': {
      if (args.length === 0 && !stdin) {
        return { stdout: '', stderr: `${commandName}: missing file\n`, exitCode: 1 };
      }
      let text = stdin || '';
      if (args.length > 0) {
        const res = vfs.readFile(args[0], vfs.getUser());
        if (!res.success) return { stdout: '', stderr: res.error + '\n', exitCode: 1 };
        text = res.data || '';
      }
      return { stdout: text + (text.endsWith('\n') ? '' : '\n'), stderr: '', exitCode: 0 };
    }

    default:
      return null;
  }
}
