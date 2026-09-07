#!/usr/bin/env node
import { StudioServer } from '../server.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4400;
const server = new StudioServer({ port });
server.start().catch((err) => {
  console.error('Failed to start Acid-test Studio:', err);
  process.exit(1);
});
