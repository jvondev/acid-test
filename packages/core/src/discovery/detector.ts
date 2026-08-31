import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import type { DiscoveredProject, DetectedDomain } from './types.js';
import { EnvScanner } from './env-scanner.js';
import { ServiceScanner } from './service-scanner.js';

export * from './types.js';
export * from './env-scanner.js';
export * from './service-scanner.js';

export class ProjectDetector {
  private static readonly ALL_DOMAINS: DetectedDomain[] = ['billing', 'db', 'auth', 'queue', 'webhook', 'ai', 'email', 'storage'];

  static async discover(targetDir: string = process.cwd()): Promise<DiscoveredProject> {
    const projectRoot = path.resolve(targetDir);
    const envVars = EnvScanner.readEnvFiles(projectRoot);
    const packageJson = this.readPackageJson(projectRoot);
    const framework = this.detectFramework(packageJson);

    const deps = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };
    const { detectedServices, discoveredRoutes, discoveredSchemas } = ServiceScanner.scan(projectRoot, deps, envVars);

    // Probe common developer ports: Next.js (3000), NestJS/Express (3001), Vite (5173), FastAPI/Django (8000), Go/Gin (8080), Supabase (54321)
    const portsToProbe = envVars['PORT'] 
      ? [parseInt(envVars['PORT'], 10), 3000, 3001, 5173, 8000, 8080, 4000, 5000, 54321] 
      : [3000, 3001, 5173, 8000, 8080, 4000, 5000, 54321];
    const liveServer = await this.probeLocalServers(portsToProbe);

    const activeDomains = detectedServices.map(s => s.domain);
    const skippedDomains = this.ALL_DOMAINS
      .filter(d => !activeDomains.includes(d))
      .map(d => ({ domain: d, reason: `No matching dependencies, routes, or environment variables detected for ${d.toUpperCase()}` }));

    return {
      projectRoot,
      projectName: packageJson?.name,
      framework,
      detectedServices,
      activeDomains,
      skippedDomains,
      envVars,
      discoveredRoutes,
      discoveredSchemas,
      liveServer,
    };
  }

  private static readPackageJson(projectRoot: string): any {
    try {
      const p = path.join(projectRoot, 'package.json');
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { /* Ignore */ }
    return null;
  }

  private static detectFramework(pkg: any): DiscoveredProject['framework'] {
    const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
    if (deps['next']) return 'nextjs';
    if (deps['@remix-run/node'] || deps['@remix-run/react']) return 'remix';
    if (deps['@nestjs/core']) return 'nestjs';
    if (deps['hono']) return 'hono';
    if (deps['fastify']) return 'fastify';
    if (deps['express']) return 'express';
    return 'vanilla';
  }

  private static async probeLocalServers(ports: number[]): Promise<{ url: string; port: number; latencyMs: number } | undefined> {
    for (const port of ports) {
      const res = await new Promise<{ up: boolean; latencyMs: number }>((resolve) => {
        const start = Date.now();
        const req = http.get(`http://localhost:${port}/`, { timeout: 250 }, () => {
          resolve({ up: true, latencyMs: Math.max(1, Date.now() - start) });
          req.destroy();
        });
        req.on('error', () => resolve({ up: false, latencyMs: 0 }));
        req.on('timeout', () => { req.destroy(); resolve({ up: false, latencyMs: 0 }); });
      });
      if (res.up) return { url: `http://localhost:${port}`, port, latencyMs: res.latencyMs };
    }
    return undefined;
  }
}
