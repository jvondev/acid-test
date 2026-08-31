import React from 'react';
import { render } from 'ink';
import { TuiApp } from './app.js';

export interface InteractiveTuiOptions {
  url?: string;
  autoRun?: boolean;
}

export async function runInteractiveTui(options: InteractiveTuiOptions = {}): Promise<void> {
  const { waitUntilExit } = render(
    <TuiApp initialUrl={options.url} autoRun={options.autoRun ?? true} />
  );
  await waitUntilExit();
}

export * from './types.js';
export * from './app.js';
