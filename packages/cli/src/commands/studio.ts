import { StudioServer } from '@acidtest/studio';

export async function runStudioCommand(options: { port?: string; host?: string }): Promise<number> {
  const port = options.port ? parseInt(options.port, 10) : 4400;
  const host = options.host || 'localhost';

  const server = new StudioServer({ port, host });
  await server.start();

  // Keep process alive for web dashboard
  return new Promise(() => {});
}
