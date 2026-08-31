import fs from 'node:fs';
import path from 'node:path';
import type { InvariantResult } from '@acid-test/core';

export function exportPromptToFile(result?: InvariantResult): boolean {
  if (!result) return false;
  const dir = path.join(process.cwd(), '.acidtest');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const promptContent = `# ⚡ ACIDTEST AI REMEDIATION PROMPT
## Vulnerability: [${result.testId}] ${result.title || result.testName}
- **Severity**: ${result.severity}
- **Category**: ${result.category}
- **Status**: ${result.status} (${result.durationMs}ms)
- **Source File**: ${result.failingFile || 'N/A'}:${result.lineNumber || 1}

---

### Problem Description:
${result.summary}

### Root Cause:
${result.rootCause || 'Concurrency or state mutation not isolated in an atomic transaction.'}

### Suggested Fix:
${result.suggestedFix || 'Apply PostgreSQL SERIALIZABLE transaction isolation or Redis distributed lock.'}

---

### Reproduction Command:
\`\`\`bash
${result.curlReproduction || '# Run acidtest CLI with concurrency to reproduce'}
\`\`\`

---
*Generated automatically by Acidtest Reliability Cockpit*
`;

  const targetFile = path.join(dir, 'remediation.prompt.md');
  fs.writeFileSync(targetFile, promptContent, 'utf-8');
  return true;
}
