import fs from 'node:fs';
import path from 'node:path';

export class EnvScanner {
  static readEnvFiles(projectRoot: string): Record<string, string> {
    const envVars: Record<string, string> = { ...(process.env as Record<string, string>) };
    const envFileNames = ['.env', '.env.local', '.env.development', '.env.production'];

    for (const name of envFileNames) {
      const filePath = path.join(projectRoot, name);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
              const eqIdx = trimmed.indexOf('=');
              const key = trimmed.slice(0, eqIdx).trim();
              let val = trimmed.slice(eqIdx + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
              }
              if (key && !envVars[key]) {
                envVars[key] = val;
              }
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
    return envVars;
  }

  static findMatchingFiles(root: string, patterns: string[]): string[] {
    const found: string[] = [];
    for (const pat of patterns) {
      const fullPath = path.join(root, pat);
      if (fs.existsSync(fullPath)) {
        found.push(pat);
      } else {
        for (const ext of ['.ts', '.js', '.tsx', '.jsx', '/route.ts', '/route.js', '/index.ts', '/index.js']) {
          if (fs.existsSync(fullPath + ext)) {
            found.push(pat + ext);
            break;
          }
        }
      }
    }
    return found;
  }
}
