import { CommandContext, CommandResult, ParsedCommandLine, ParsedPipelineStage, InteractivePromptState } from '@/types/terminal';
import { VFSEngine } from '@/lib/vfs/vfs-engine';
import { CommandParser } from './parser';
import { BashScriptEngine } from './bash-script-engine';
import { handleFileOps } from './commands/file-ops';
import { handleTextTools } from './commands/text-tools';
import { handleSysAdmin } from './commands/sys-admin';
import { handleNetworkSim } from './commands/network-sim';

export interface PendingScriptState {
  remainingLines: string[];
  env: Record<string, string>;
  scriptName: string;
  args: string[];
  accumulatedStdout: string;
  accumulatedStderr: string;
  variableNames: string[];
}

export class CommandExecutor {
  private vfs: VFSEngine;
  private env: Record<string, string>;
  private history: string[] = [];
  private pendingScriptState: PendingScriptState | null = null;

  constructor(vfs: VFSEngine, initialEnv: Record<string, string> = {}) {
    this.vfs = vfs;
    this.env = {
      USER: 'student',
      HOME: '/home/student',
      HOSTNAME: 'evcyber',
      SHELL: '/bin/bash',
      TERM: 'xterm-256color',
      PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      PWD: vfs.getCwd(),
      ...initialEnv,
    };
  }

  public getHistory(): string[] {
    return this.history;
  }

  public getEnv(): Record<string, string> {
    return this.env;
  }

  public setEnv(key: string, value: string): void {
    this.env[key] = value;
  }

  public addToHistory(cmd: string): void {
    if (cmd.trim() && (this.history.length === 0 || this.history[this.history.length - 1] !== cmd)) {
      this.history.push(cmd);
      // Append to ~/.bash_history in VFS
      this.vfs.writeFile('/home/student/.bash_history', `${cmd}\n`, 'student', true);
    }
  }

  /**
   * Resumes a paused script when user provides stdin input for `read`
   */
  public async resumeScript(userInput: string, promptState?: InteractivePromptState): Promise<CommandResult> {
    if (!this.pendingScriptState && !promptState?.remainingScriptLines) {
      // Single interactive read command on terminal
      if (promptState && promptState.variableNames.length > 0) {
        const words = userInput.trim().split(/\s+/);
        promptState.variableNames.forEach((varName, idx) => {
          if (idx === promptState.variableNames.length - 1) {
            this.env[varName] = words.slice(idx).join(' ');
          } else {
            this.env[varName] = words[idx] || '';
          }
        });
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    const state: PendingScriptState = this.pendingScriptState || {
      remainingLines: promptState?.remainingScriptLines || [],
      env: promptState?.scriptEnv || { ...this.env },
      scriptName: promptState?.scriptName || 'script.sh',
      args: promptState?.scriptArgs || [],
      accumulatedStdout: '',
      accumulatedStderr: '',
      variableNames: promptState?.variableNames || ['REPLY'],
    };

    // Assign user input to variableNames
    const words = userInput.trim().split(/\s+/);
    state.variableNames.forEach((varName, idx) => {
      if (idx === state.variableNames.length - 1) {
        state.env[varName] = words.slice(idx).join(' ');
      } else {
        state.env[varName] = words[idx] || '';
      }
      this.env[varName] = state.env[varName]; // Sync to global env
    });

    this.pendingScriptState = null;

    // Continue executing remaining script lines
    return this.executeScriptLines(state.remainingLines, state);
  }

  /**
   * Main entry point for executing any command line string
   */
  public async execute(rawCommandLine: string): Promise<CommandResult> {
    const trimmed = rawCommandLine.trim();
    if (!trimmed) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    this.addToHistory(trimmed);
    this.env.PWD = this.vfs.getCwd();

    // Check for catastrophic system self-destruct (e.g. sudo rm -rf /* or --no-preserve-root)
    const lowerCmd = trimmed.toLowerCase();
    const isRootNuke = 
      /^(sudo\s+)?rm\s+.*-(r|rf|fr|r.*f|f.*r).*\s+(\/\*|\/|\/\*.*)(\s+--no-preserve-root)?$/.test(lowerCmd) ||
      lowerCmd.includes('rm -rf /*') ||
      lowerCmd.includes('rm -fr /*') ||
      lowerCmd.includes('rm -rf /') ||
      lowerCmd.includes('rm -fr /') ||
      (lowerCmd.includes('rm') && lowerCmd.includes('--no-preserve-root'));

    if (isRootNuke) {
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('lfhp:os_crash', {
            detail: { triggerCommand: trimmed, timestamp: Date.now() }
          }));
        }, 350);
      }
      return {
        stdout: `\x1b[1;31mrm: WARNING: deleting root filesystem '/'\x1b[0m\n` +
                `rm: unlinking '/bin'...\n` +
                `rm: unlinking '/sbin'...\n` +
                `rm: unlinking '/etc'...\n` +
                `rm: unlinking '/lib'...\n` +
                `rm: unlinking '/vmlinuz'...\n` +
                `\x1b[1;31m[CRITICAL KERNEL PANIC]: Rootfs destroyed. Halting OS...\x1b[0m\n`,
        stderr: '',
        exitCode: 139,
      };
    }

    // Process command substitutions $(...) and `...` first
    const expandedCommand = await this.expandCommandSubstitutions(trimmed);

    // Split compound commands by semicolon ';' or '&&' or '||'
    return this.executeCompoundCommand(expandedCommand);
  }

  /**
   * Expands $(command) or `command` substitutions
   */
  private async expandCommandSubstitutions(cmd: string): Promise<string> {
    let result = cmd;

    // Expand $(cmd) - excluding $(( arithmetic ))
    const subRegex = /\$\((?!\()([^\)]+)\)/g;
    let match;
    while ((match = subRegex.exec(result)) !== null) {
      const innerCmd = match[1];
      const subRes = await this.executePipeline(innerCmd);
      const outputClean = (subRes.stdout || '').replace(/\r?\n$/, '').replace(/\r?\n/g, ' ');
      result = result.replace(match[0], outputClean);
    }

    // Expand `cmd`
    const backtickRegex = /`([^`]+)`/g;
    while ((match = backtickRegex.exec(result)) !== null) {
      const innerCmd = match[1];
      const subRes = await this.executePipeline(innerCmd);
      const outputClean = (subRes.stdout || '').replace(/\r?\n$/, '').replace(/\r?\n/g, ' ');
      result = result.replace(match[0], outputClean);
    }

    return result;
  }

  /**
   * Executes compound statements chained with ;, &&, ||
   */
  private async executeCompoundCommand(raw: string): Promise<CommandResult> {
    // Tokenize top-level separators ; && ||
    const segments = this.splitCompoundSegments(raw);

    let totalStdout = '';
    let totalStderr = '';
    let lastExitCode = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      // Check conditional operators
      if (seg.op === '&&' && lastExitCode !== 0) {
        continue;
      }
      if (seg.op === '||' && lastExitCode === 0) {
        continue;
      }

      const res = await this.executeSingleStatement(seg.cmd);

      totalStdout += res.stdout;
      totalStderr += res.stderr;
      lastExitCode = res.exitCode;

      if (res.clearTerminal || res.launchNano || res.launchApp || res.interactivePrompt) {
        return {
          ...res,
          stdout: totalStdout,
          stderr: totalStderr,
        };
      }
    }

    return {
      stdout: totalStdout,
      stderr: totalStderr,
      exitCode: lastExitCode,
    };
  }

  /**
   * Splits a command line into segments by ; , && , || respecting quotes
   */
  private splitCompoundSegments(cmd: string): { cmd: string; op?: '&&' | '||' | ';' }[] {
    const segments: { cmd: string; op?: '&&' | '||' | ';' }[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < cmd.length; i++) {
      const c = cmd[i];
      const next = cmd[i + 1];

      if (c === "'" && !inDouble) {
        inSingle = !inSingle;
        current += c;
      } else if (c === '"' && !inSingle) {
        inDouble = !inDouble;
        current += c;
      } else if (!inSingle && !inDouble && c === '&' && next === '&') {
        if (current.trim()) segments.push({ cmd: current.trim() });
        segments.push({ cmd: '', op: '&&' });
        current = '';
        i++; // skip next &
      } else if (!inSingle && !inDouble && c === '|' && next === '|') {
        if (current.trim()) segments.push({ cmd: current.trim() });
        segments.push({ cmd: '', op: '||' });
        current = '';
        i++; // skip next |
      } else if (!inSingle && !inDouble && c === ';') {
        if (current.trim()) segments.push({ cmd: current.trim() });
        segments.push({ cmd: '', op: ';' });
        current = '';
      } else {
        current += c;
      }
    }

    if (current.trim()) {
      segments.push({ cmd: current.trim() });
    }

    // Merge operators with subsequent commands
    const merged: { cmd: string; op?: '&&' | '||' | ';' }[] = [];
    let pendingOp: '&&' | '||' | ';' | undefined;

    for (const item of segments) {
      if (item.op) {
        pendingOp = item.op;
      } else if (item.cmd) {
        merged.push({ cmd: item.cmd, op: pendingOp });
        pendingOp = undefined;
      }
    }

    return merged;
  }

  /**
   * Executes a single statement (variable assignment, script run, or command pipeline)
   */
  private async executeSingleStatement(cmdStr: string): Promise<CommandResult> {
    const trimmed = cmdStr.trim();
    if (!trimmed) return { stdout: '', stderr: '', exitCode: 0 };

    // 1. Direct variable assignment: VAR=value or export VAR=value
    const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=(['"]?)([\s\S]*?)\2$/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const val = BashScriptEngine.expandVariables(assignMatch[3], this.env);
      this.env[varName] = val;
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    // 2. Arithmetic command: (( A = B + C ))
    const arithMatch = trimmed.match(/^\(\((.+)\)\)$/);
    if (arithMatch) {
      const inner = arithMatch[1];
      if (inner.includes('=')) {
        const [k, expr] = inner.split('=');
        const varName = k.trim();
        const val = BashScriptEngine.evaluateArithmetic(expr, this.env);
        this.env[varName] = val.toString();
      } else {
        BashScriptEngine.evaluateArithmetic(inner, this.env);
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    // 3. Script Execution: `bash file.sh`, `sh file.sh`, `./file.sh`, `source file.sh`, `. file.sh`
    const tokens = trimmed.split(/\s+/);
    const firstWord = tokens[0];

    const isScriptInvocation = 
      firstWord === 'bash' || 
      firstWord === 'sh' || 
      firstWord === 'source' || 
      firstWord === '.' ||
      firstWord.startsWith('./') ||
      firstWord.endsWith('.sh');

    if (isScriptInvocation && (tokens.length > 1 || firstWord.startsWith('./') || firstWord.endsWith('.sh'))) {
      let scriptPath = '';
      let scriptArgs: string[] = [];

      if (firstWord === 'bash' || firstWord === 'sh' || firstWord === 'source' || firstWord === '.') {
        scriptPath = tokens[1] || '';
        scriptArgs = tokens.slice(2);
      } else {
        scriptPath = firstWord;
        scriptArgs = tokens.slice(1);
      }

      if (scriptPath) {
        const scriptRes = await this.runScriptFile(scriptPath, scriptArgs);
        if (scriptRes !== null) {
          return scriptRes;
        }
      }
    }

    // 4. Standard Command Pipeline
    return this.executePipeline(trimmed);
  }

  /**
   * Reads a .sh script file from VFS and executes it line-by-line
   */
  private async runScriptFile(filePath: string, args: string[]): Promise<CommandResult | null> {
    const readRes = this.vfs.readFile(filePath, this.vfs.getUser());
    if (!readRes.success) {
      return {
        stdout: '',
        stderr: `bash: ${filePath}: No such file or directory\n`,
        exitCode: 127,
      };
    }

    const content = readRes.data || '';
    const rawLines = content.split('\n');

    const scriptEnv: Record<string, string> = {
      ...this.env,
      '0': filePath,
      '#': args.length.toString(),
      '@': args.join(' '),
      '*': args.join(' '),
    };

    args.forEach((arg, idx) => {
      scriptEnv[(idx + 1).toString()] = arg;
    });

    const state: PendingScriptState = {
      remainingLines: rawLines,
      env: scriptEnv,
      scriptName: filePath,
      args,
      accumulatedStdout: '',
      accumulatedStderr: '',
      variableNames: [],
    };

    return this.executeScriptLines(rawLines, state);
  }

  /**
   * Executes an array of script lines with support for conditionals, loops, read pauses, and variable scope
   */
  private async executeScriptLines(lines: string[], state: PendingScriptState): Promise<CommandResult> {
    let i = 0;

    while (i < lines.length) {
      const rawLine = lines[i].trim();
      i++;

      // Skip empty lines and full comments
      if (!rawLine || rawLine.startsWith('#')) {
        continue;
      }

      // Handle `if ... fi` blocks
      if (rawLine.startsWith('if ')) {
        const ifBlock = this.collectIfBlock(lines, i - 1);
        i = ifBlock.nextIndex;
        const res = await this.executeIfBlock(ifBlock, state);
        if (res.exitCode !== 0 && res.stderr) {
          return { stdout: state.accumulatedStdout, stderr: state.accumulatedStderr, exitCode: res.exitCode };
        }
        if (res.interactivePrompt) {
          state.remainingLines = lines.slice(i);
          this.pendingScriptState = state;
          return {
            ...res,
            stdout: state.accumulatedStdout,
            stderr: state.accumulatedStderr,
          };
        }
        continue;
      }

      // Handle `for ... done` blocks
      if (rawLine.startsWith('for ')) {
        const forBlock = this.collectForBlock(lines, i - 1);
        i = forBlock.nextIndex;
        const res = await this.executeForBlock(forBlock, state);
        if (res.interactivePrompt) {
          state.remainingLines = lines.slice(i);
          this.pendingScriptState = state;
          return {
            ...res,
            stdout: state.accumulatedStdout,
            stderr: state.accumulatedStderr,
          };
        }
        continue;
      }

      // Handle `while ... done` blocks
      if (rawLine.startsWith('while ')) {
        const whileBlock = this.collectWhileBlock(lines, i - 1);
        i = whileBlock.nextIndex;
        const res = await this.executeWhileBlock(whileBlock, state);
        if (res.interactivePrompt) {
          state.remainingLines = lines.slice(i);
          this.pendingScriptState = state;
          return {
            ...res,
            stdout: state.accumulatedStdout,
            stderr: state.accumulatedStderr,
          };
        }
        continue;
      }

      // Handle exit / return
      if (rawLine === 'exit' || rawLine.startsWith('exit ')) {
        const code = parseInt(rawLine.split(/\s+/)[1] || '0', 10);
        return {
          stdout: state.accumulatedStdout,
          stderr: state.accumulatedStderr,
          exitCode: isNaN(code) ? 0 : code,
        };
      }

      // Sync state env with global executor env
      Object.assign(this.env, state.env);

      // Single command line inside script
      const res = await this.executeCompoundCommand(rawLine);

      // Sync updated env back into state.env
      Object.assign(state.env, this.env);

      state.accumulatedStdout += res.stdout;
      state.accumulatedStderr += res.stderr;

      // If command requested interactive read from student
      if (res.interactivePrompt) {
        state.remainingLines = lines.slice(i);
        state.variableNames = res.interactivePrompt.variableNames;
        this.pendingScriptState = state;
        return {
          ...res,
          stdout: state.accumulatedStdout,
          stderr: state.accumulatedStderr,
          interactivePrompt: {
            ...res.interactivePrompt,
            remainingScriptLines: state.remainingLines,
            scriptEnv: state.env,
            scriptName: state.scriptName,
            scriptArgs: state.args,
          }
        };
      }
    }

    return {
      stdout: state.accumulatedStdout,
      stderr: state.accumulatedStderr,
      exitCode: 0,
    };
  }

  /**
   * Helper to parse and execute `if ... then ... elif ... else ... fi`
   */
  private collectIfBlock(lines: string[], startIdx: number): { condition: string; thenLines: string[]; elseLines: string[]; nextIndex: number } {
    const rawFirst = lines[startIdx].trim();
    const cond = rawFirst.replace(/^if\s+/, '').replace(/;\s*then$/, '').trim();

    const thenLines: string[] = [];
    const elseLines: string[] = [];
    let inElse = false;
    let depth = 1;
    let i = startIdx + 1;

    while (i < lines.length && depth > 0) {
      const line = lines[i].trim();
      if (line.startsWith('if ')) {
        depth++;
      } else if (line === 'fi' || line.startsWith('fi ')) {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      } else if (depth === 1 && (line === 'else' || line.startsWith('else '))) {
        inElse = true;
        i++;
        continue;
      }

      if (line !== 'then' && line !== 'then;') {
        if (inElse) elseLines.push(lines[i]);
        else thenLines.push(lines[i]);
      }
      i++;
    }

    return { condition: cond, thenLines, elseLines, nextIndex: i };
  }

  private async executeIfBlock(block: { condition: string; thenLines: string[]; elseLines: string[]; nextIndex: number }, state: PendingScriptState): Promise<CommandResult> {
    const isTrue = BashScriptEngine.evaluateCondition(block.condition, state.env, this.vfs);
    const targetLines = isTrue ? block.thenLines : block.elseLines;
    return this.executeScriptLines(targetLines, state);
  }

  /**
   * Helper to parse and execute `for item in a b c; do ... done`
   */
  private collectForBlock(lines: string[], startIdx: number): { header: string; bodyLines: string[]; nextIndex: number } {
    const header = lines[startIdx].trim();
    const bodyLines: string[] = [];
    let depth = 1;
    let i = startIdx + 1;

    while (i < lines.length && depth > 0) {
      const line = lines[i].trim();
      if (line.startsWith('for ')) {
        depth++;
      } else if (line === 'done' || line.startsWith('done ')) {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }

      if (line !== 'do' && line !== 'do;') {
        bodyLines.push(lines[i]);
      }
      i++;
    }

    return { header, bodyLines, nextIndex: i };
  }

  private async executeForBlock(block: { header: string; bodyLines: string[]; nextIndex: number }, state: PendingScriptState): Promise<CommandResult> {
    const forMatch = block.header.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+)$/);
    if (!forMatch) return { stdout: '', stderr: '', exitCode: 0 };

    const varName = forMatch[1];
    const rawItemsStr = forMatch[2].replace(/;\s*do$/, '').trim();
    const expandedItems = BashScriptEngine.expandVariables(rawItemsStr, state.env);
    const items = expandedItems.split(/\s+/);

    for (const item of items) {
      state.env[varName] = item;
      this.env[varName] = item;
      const res = await this.executeScriptLines(block.bodyLines, state);
      if (res.interactivePrompt) return res;
    }

    return { stdout: '', stderr: '', exitCode: 0 };
  }

  /**
   * Helper to parse and execute `while [ cond ]; do ... done`
   */
  private collectWhileBlock(lines: string[], startIdx: number): { condition: string; bodyLines: string[]; nextIndex: number } {
    const rawFirst = lines[startIdx].trim();
    const cond = rawFirst.replace(/^while\s+/, '').replace(/;\s*do$/, '').trim();
    const bodyLines: string[] = [];
    let depth = 1;
    let i = startIdx + 1;

    while (i < lines.length && depth > 0) {
      const line = lines[i].trim();
      if (line.startsWith('while ')) {
        depth++;
      } else if (line === 'done' || line.startsWith('done ')) {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }

      if (line !== 'do' && line !== 'do;') {
        bodyLines.push(lines[i]);
      }
      i++;
    }

    return { condition: cond, bodyLines, nextIndex: i };
  }

  private async executeWhileBlock(block: { condition: string; bodyLines: string[]; nextIndex: number }, state: PendingScriptState): Promise<CommandResult> {
    let iterations = 0;
    const MAX_ITERATIONS = 1000;

    while (iterations < MAX_ITERATIONS && BashScriptEngine.evaluateCondition(block.condition, state.env, this.vfs)) {
      iterations++;
      const res = await this.executeScriptLines(block.bodyLines, state);
      if (res.interactivePrompt) return res;
    }

    return { stdout: '', stderr: '', exitCode: 0 };
  }

  /**
   * Executes a pipeline (e.g. `cat file.txt | grep target | wc -l`)
   */
  public async executePipeline(rawPipeline: string): Promise<CommandResult> {
    const parsed: ParsedCommandLine = CommandParser.parse(rawPipeline, this.env);
    if (parsed.stages.length === 0) {
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    let currentStdin = '';
    let lastResult: CommandResult = { stdout: '', stderr: '', exitCode: 0 };

    for (let i = 0; i < parsed.stages.length; i++) {
      const stage = parsed.stages[i];

      // Handle input redirection `<`
      if (stage.redirectIn) {
        const readRes = this.vfs.readFile(stage.redirectIn.file, this.vfs.getUser());
        if (!readRes.success) {
          return { stdout: '', stderr: `bash: ${stage.redirectIn.file}: No such file or directory\n`, exitCode: 1 };
        }
        currentStdin = readRes.data || '';
      }

      const stageCtx: CommandContext = {
        cwd: this.vfs.getCwd(),
        user: this.vfs.getUser(),
        hostname: this.env.HOSTNAME || 'evcyber',
        env: this.env,
        stdin: currentStdin,
        args: stage.args,
        flags: stage.flags,
        rawCommand: stage.command + (stage.args.length > 0 ? ' ' + stage.args.join(' ') : ''),
      };

      lastResult = this.executeSingleStage(stageCtx, stage.command);

      // If stage launched nano, cleared terminal, or triggered interactive prompt
      if (lastResult.launchNano || lastResult.clearTerminal || lastResult.interactivePrompt) {
        return lastResult;
      }

      if (lastResult.exitCode !== 0 && lastResult.stderr && i < parsed.stages.length - 1) {
        // Pipeline broken by error
        return lastResult;
      }

      // Handle output redirection `>` or `>>` on this stage
      if (stage.redirectOut) {
        const targetFile = stage.redirectOut.file;
        const append = stage.redirectOut.append;
        const writeRes = this.vfs.writeFile(targetFile, lastResult.stdout, this.vfs.getUser(), append);
        if (!writeRes.success) {
          return { stdout: '', stderr: writeRes.error + '\n', exitCode: 1 };
        }
        // Redirection consumes stdout
        lastResult.stdout = '';
      }

      // Next stage gets stdout as stdin
      currentStdin = lastResult.stdout;
    }

    // Set $? exit code
    this.env['?'] = lastResult.exitCode.toString();

    return lastResult;
  }

  private executeSingleStage(ctx: CommandContext, commandName: string): CommandResult {
    // 1. File ops (includes echo, pwd, read, test, expr, export, unset)
    let res = handleFileOps(ctx, this.vfs);
    if (res !== null) return res;

    // 2. Text tools (grep, find, which, head, tail, wc, cat, sort, uniq, awk, sed, cut, tr)
    res = handleTextTools(ctx, this.vfs);
    if (res !== null) return res;

    // 3. Sys Admin & Info (whoami, uname, hostname, date, id, ps, top, kill, chmod)
    res = handleSysAdmin(ctx, this.vfs, this.history);
    if (res !== null) return res;

    // 4. Network Simulator (ip, ifconfig, ping, nmap, curl)
    res = handleNetworkSim(ctx, this.vfs);
    if (res !== null) return res;

    return {
      stdout: '',
      stderr: `bash: ${commandName}: command not found\n`,
      exitCode: 127,
    };
  }
}

