export type DetectedDomain = 'billing' | 'db' | 'auth' | 'queue' | 'webhook' | 'ai' | 'email' | 'storage';

export interface DetectedService {
  domain: DetectedDomain;
  provider: string;
  source: 'package_json' | 'env_var' | 'route_file' | 'schema_file' | 'manual';
  evidence: string;
  files: string[];
}

export interface DiscoveredProject {
  projectRoot: string;
  projectName?: string;
  framework?: 'nextjs' | 'express' | 'fastify' | 'remix' | 'nestjs' | 'hono' | 'vanilla';
  detectedServices: DetectedService[];
  activeDomains: DetectedDomain[];
  skippedDomains: { domain: DetectedDomain; reason: string }[];
  envVars: Record<string, string>;
  discoveredRoutes: { domain: DetectedDomain; path: string; filePath: string }[];
  discoveredSchemas: string[];
  liveServer?: { url: string; port: number; latencyMs: number };
}
