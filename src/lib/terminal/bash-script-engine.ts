import { CommandContext, CommandResult, InteractivePromptState } from '@/types/terminal';
import { VFSEngine } from '@/lib/vfs/vfs-engine';

export interface BashExecutionState {
  lines: string[];
  currentLineIndex: number;
  env: Record<string, string>;
  functions: Record<string, string[]>;
  scriptName: string;
  args: string[];
  stdoutBuffer: string;
  stderrBuffer: string;
  exitCode: number;
}

export class BashScriptEngine {
  /**
   * Evaluates arithmetic expression like "$(( A + B ))" or "5 * 10"
   */
  public static evaluateArithmetic(expr: string, env: Record<string, string>): number {
    let clean = expr.trim();
    // Replace variable names with their values
    clean = clean.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, varName) => {
      return env[varName] || '0';
    });
    clean = clean.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
      return env[match] !== undefined ? env[match] : match;
    });

    try {
      // Safe arithmetic evaluator (only allows numbers, operators, parens)
      if (!/^[0-9+\-*/%() \t.<>!=&|^~]+$/.test(clean)) {
        return 0;
      }
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${clean});`)();
      return typeof result === 'number' && !isNaN(result) ? Math.floor(result) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Evaluates bash test conditions like `[ -f file ]`, `[ "$a" = "$b" ]`, `[ $a -gt $b ]`
   */
  public static evaluateCondition(condStr: string, env: Record<string, string>, vfs: VFSEngine): boolean {
    let raw = condStr.trim();
    // Strip surrounding brackets: [ ... ] or [[ ... ]] or test ...
    if (raw.startsWith('[[')) raw = raw.replace(/^\[\[\s*/, '').replace(/\s*\]\]$/, '');
    else if (raw.startsWith('[')) raw = raw.replace(/^\[\s*/, '').replace(/\s*\]$/, '');
    else if (raw.startsWith('test ')) raw = raw.replace(/^test\s+/, '');

    raw = this.expandVariables(raw, env);
    const tokens = this.tokenizeCondition(raw);

    if (tokens.length === 0) return false;

    // Negation !
    if (tokens[0] === '!') {
      return !this.evaluateCondition(tokens.slice(1).join(' '), env, vfs);
    }

    // Unary file / string tests
    if (tokens.length === 2 && tokens[0].startsWith('-')) {
      const flag = tokens[0];
      const target = tokens[1];
      switch (flag) {
        case '-f': { // regular file
          const node = vfs.getNodeByPath(target);
          return !!(node && node.type === 'file');
        }
        case '-d': { // directory
          const node = vfs.getNodeByPath(target);
          return !!(node && node.type === 'directory');
        }
        case '-e': // exists
        case '-a': {
          const node = vfs.getNodeByPath(target);
          return !!node;
        }
        case '-s': { // file exists and not empty
          const node = vfs.getNodeByPath(target);
          return !!(node && node.type === 'file' && node.size > 0);
        }
        case '-z': { // zero length string
          return target.length === 0;
        }
        case '-n': { // non-zero length string
          return target.length > 0;
        }
        case '-r':
        case '-w':
        case '-x': {
          const node = vfs.getNodeByPath(target);
          return !!node;
        }
      }
    }

    // Binary comparisons: [ "$a" == "$b" ], [ $a -eq $b ], [ $a -gt $b ]
    if (tokens.length === 3) {
      const left = tokens[0];
      const op = tokens[1];
      const right = tokens[2];

      const numLeft = parseInt(left, 10);
      const numRight = parseInt(right, 10);
      const areNumbers = !isNaN(numLeft) && !isNaN(numRight);

      switch (op) {
        case '=':
        case '==':
          return left === right;
        case '!=':
          return left !== right;
        case '-eq':
          return areNumbers && numLeft === numRight;
        case '-ne':
          return areNumbers && numLeft !== numRight;
        case '-gt':
          return areNumbers && numLeft > numRight;
        case '-ge':
          return areNumbers && numLeft >= numRight;
        case '-lt':
          return areNumbers && numLeft < numRight;
        case '-le':
          return areNumbers && numLeft <= numRight;
      }
    }

    // Single non-empty argument evaluates to true
    if (tokens.length === 1) {
      return tokens[0].length > 0 && tokens[0] !== '0';
    }

    return false;
  }

  /**
   * Expands variables like $VAR, ${VAR}, $?, $1, $#, etc.
   */
  public static expandVariables(input: string, env: Record<string, string>): string {
    let result = input;

    // Expand $(( arithmetic ))
    result = result.replace(/\$\(\(([\s\S]*?)\)\)/g, (_, expr) => {
      return this.evaluateArithmetic(expr, env).toString();
    });

    // Expand ${VAR:-default}
    result = result.replace(/\$\{([a-zA-Z0-9_?#@*]+):-([^}]+)\}/g, (_, varName, defaultVal) => {
      const val = env[varName];
      return val !== undefined && val !== '' ? val : defaultVal;
    });

    // Expand ${VAR}
    result = result.replace(/\$\{([a-zA-Z0-9_?#@*]+)\}/g, (_, varName) => {
      return env[varName] !== undefined ? env[varName] : '';
    });

    // Expand $VAR
    result = result.replace(/\$([a-zA-Z0-9_?#@*]+)/g, (_, varName) => {
      return env[varName] !== undefined ? env[varName] : '';
    });

    return result;
  }

  /**
   * Tokenizer that respects quotes
   */
  private static tokenizeCondition(str: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote: string | null = null;

    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if ((c === '"' || c === "'") && inQuote === null) {
        inQuote = c;
      } else if (c === inQuote) {
        inQuote = null;
      } else if (/\s/.test(c) && inQuote === null) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += c;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }
}
