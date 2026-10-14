import { ParsedCommandLine, ParsedPipelineStage } from '@/types/terminal';
import { BashScriptEngine } from './bash-script-engine';

export class CommandParser {
  public static parse(input: string, env: Record<string, string> = {}): ParsedCommandLine {
    const raw = input.trim();
    if (!raw) {
      return { stages: [], raw: '' };
    }

    // Split pipeline by '|' but ignore pipes inside quotes
    const pipelineSegments = this.splitPipes(raw);
    const stages: ParsedPipelineStage[] = [];

    for (const seg of pipelineSegments) {
      const stage = this.parseStage(seg.trim(), env);
      if (stage) {
        stages.push(stage);
      }
    }

    return {
      stages,
      raw,
    };
  }

  private static splitPipes(cmd: string): string[] {
    const segments: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < cmd.length; i++) {
      const char = cmd[i];

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        current += char;
      } else if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        current += char;
      } else if (char === '|' && !inSingleQuote && !inDoubleQuote) {
        segments.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      segments.push(current);
    }

    return segments;
  }

  private static parseStage(stageStr: string, env: Record<string, string>): ParsedPipelineStage | null {
    if (!stageStr) return null;

    // Check for redirections: >>, >, <
    let redirectOut: { file: string; append: boolean } | undefined;
    let redirectIn: { file: string } | undefined;
    let cleanedStr = stageStr;

    // Output Append '>>'
    const appendMatch = cleanedStr.match(/>>\s*([^\s|>]+)/);
    if (appendMatch) {
      redirectOut = { file: appendMatch[1].replace(/^['"]|['"]$/g, ''), append: true };
      cleanedStr = cleanedStr.replace(appendMatch[0], ' ');
    } else {
      // Output Overwrite '>'
      const outMatch = cleanedStr.match(/>\s*([^\s|>]+)/);
      if (outMatch) {
        redirectOut = { file: outMatch[1].replace(/^['"]|['"]$/g, ''), append: false };
        cleanedStr = cleanedStr.replace(outMatch[0], ' ');
      }
    }

    // Input Redirect '<'
    const inMatch = cleanedStr.match(/<\s*([^\s|>]+)/);
    if (inMatch) {
      redirectIn = { file: inMatch[1].replace(/^['"]|['"]$/g, '') };
      cleanedStr = cleanedStr.replace(inMatch[0], ' ');
    }

    // Tokenize
    const rawTokens = this.tokenize(cleanedStr);
    if (rawTokens.length === 0) return null;

    // Expand variables in tokens that are not single-quoted
    const tokens = rawTokens.map(tok => {
      if (tok.startsWith("'") && tok.endsWith("'") && tok.length >= 2) {
        // Single quoted: strip quotes, do NOT expand variables
        return tok.slice(1, -1);
      }
      if (tok.startsWith('"') && tok.endsWith('"') && tok.length >= 2) {
        // Double quoted: strip quotes, expand variables
        return BashScriptEngine.expandVariables(tok.slice(1, -1), env);
      }
      return BashScriptEngine.expandVariables(tok, env);
    });

    const command = tokens[0];
    const args: string[] = [];
    const flags: Record<string, string | boolean> = {};

    for (let i = 1; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.startsWith('--')) {
        const flagName = token.slice(2);
        if (flagName.includes('=')) {
          const [k, v] = flagName.split('=');
          flags[k] = v;
        } else {
          flags[flagName] = true;
        }
      } else if (token.startsWith('-') && token.length > 1 && !/^\-\d+$/.test(token)) {
        // e.g. -la, -sV, -p, -f, -d
        const flagBody = token.slice(1);
        const valueFlags = ['p', 'c', 'n', 'd', 'f', 'X', 's', 'e', 'm', 'u', 'o', 'H', 'A', 'B', 'C', 't', 'name', 'type'];
        if (valueFlags.includes(flagBody)) {
          // Flag that takes the next argument (if available and not starting with -)
          if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
            flags[flagBody] = tokens[i + 1];
            i++;
          } else {
            flags[flagBody] = true;
          }
        } else {
          // Bundle of single letter flags e.g. -la -> l: true, a: true
          for (let c of flagBody) {
            flags[c] = true;
          }
        }
      } else {
        args.push(token);
      }
    }

    return {
      command,
      args,
      flags,
      redirectOut,
      redirectIn,
    };
  }

  private static tokenize(str: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;
    let parenDepth = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const nextChar = str[i + 1];

      if (char === "'" && !inDoubleQuote && !inBacktick) {
        inSingleQuote = !inSingleQuote;
        current += char;
      } else if (char === '"' && !inSingleQuote && !inBacktick) {
        inDoubleQuote = !inDoubleQuote;
        current += char;
      } else if (char === '`' && !inSingleQuote) {
        inBacktick = !inBacktick;
        current += char;
      } else if (char === '$' && nextChar === '(' && !inSingleQuote) {
        parenDepth++;
        current += char;
      } else if (char === '(' && parenDepth > 0 && !inSingleQuote) {
        parenDepth++;
        current += char;
      } else if (char === ')' && parenDepth > 0 && !inSingleQuote) {
        parenDepth--;
        current += char;
      } else if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote && !inBacktick && parenDepth === 0) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }
}

