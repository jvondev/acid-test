import React from 'react';
import { render } from 'ink';
import { TuiApp } from './app.js';
import { MouseTracker } from './mouse-tracker.js';

export interface InteractiveTuiOptions {
  url?: string;
  autoRun?: boolean;
}

export async function runInteractiveTui(options: InteractiveTuiOptions = {}): Promise<void> {
  // Enter full-screen alternate buffer & enable SGR mouse tracking
  if (process.stdout.isTTY) {
    process.stdout.write('\x1b[?1049h\x1b[H\x1b[2J');
    MouseTracker.enable();
  }

  const { waitUntilExit } = render(
    <TuiApp initialUrl={options.url} autoRun={options.autoRun ?? true} />
  );

  try {
    await waitUntilExit();
  } finally {
    // Restore main terminal buffer & disable mouse tracking cleanly on exit
    if (process.stdout.isTTY) {
      MouseTracker.disable();
      process.stdout.write('\x1b[?1049l');
    }
  }
}

export * from './types.js';
export * from './app.js';
export * from './theme.js';
export * from './mouse-tracker.js';
