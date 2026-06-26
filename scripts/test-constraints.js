#!/usr/bin/env node

process.argv.push('--test-only')
await import('./seed-constraints.js')
