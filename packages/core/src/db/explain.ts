export interface ExplainNode {
  'Node Type': string;
  'Relation Name'?: string;
  'Alias'?: string;
  'Startup Cost'?: number;
  'Total Cost'?: number;
  'Plan Rows'?: number;
  'Plan Width'?: number;
  'Actual Startup Time'?: number;
  'Actual Total Time'?: number;
  'Actual Rows'?: number;
  'Actual Loops'?: number;
  'Shared Hit Blocks'?: number;
  'Shared Read Blocks'?: number;
  'Plans'?: ExplainNode[];
}

export interface ExplainAnalyzeResult {
  executionTimeMs: number;
  planningTimeMs: number;
  hasSeqScan: boolean;
  seqScanTables: string[];
  totalBuffersRead: number;
  rootNode?: ExplainNode;
  rawJson?: unknown;
}

export class ExplainAnalyzer {
  static parse(planJson: unknown): ExplainAnalyzeResult {
    const raw = Array.isArray(planJson) ? planJson[0] : planJson;
    const plan = (raw as Record<string, unknown>)?.['Plan'] as ExplainNode | undefined;
    const executionTimeMs = (raw as Record<string, number>)?.['Execution Time'] ?? 0;
    const planningTimeMs = (raw as Record<string, number>)?.['Planning Time'] ?? 0;

    const seqScanTables: string[] = [];

    function traverse(node?: ExplainNode) {
      if (!node) return;
      if (node['Node Type'] === 'Seq Scan' && node['Relation Name']) {
        seqScanTables.push(node['Relation Name']);
      }
      if (node.Plans && Array.isArray(node.Plans)) {
        for (const child of node.Plans) {
          traverse(child);
        }
      }
    }

    traverse(plan);

    return {
      executionTimeMs,
      planningTimeMs,
      hasSeqScan: seqScanTables.length > 0,
      seqScanTables,
      totalBuffersRead: (plan?.['Shared Read Blocks'] ?? 0) + (plan?.['Shared Hit Blocks'] ?? 0),
      rootNode: plan,
      rawJson: raw,
    };
  }
}
