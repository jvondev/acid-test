import { RatatuiEngine, type EngineOptions } from './engine.js';

export interface InteractiveTuiOptions extends EngineOptions {}

export async function runInteractiveTui(options: InteractiveTuiOptions = {}): Promise<void> {
  const engine = new RatatuiEngine(options);
  await engine.start(options.autoRun ?? true);
}

export * from './types.js';
export * from './engine.js';
export * from './theme.js';
export * from './mouse-tracker.js';
