#!/usr/bin/env node

import readline from 'readline';

import {
  help,
  parseExpr,
  bindExpr,
  evalExpr,
  clearEnv,
  betaReduceExpr,
} from './repl';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'λ ',
});

rl.prompt();

rl.on('line', (input: string) => {
  input = input.trim();
  if (input.startsWith(':')) {
    input = input.substr(1).trim();
    if (input === 'q' || input === 'quit') {
      process.exit(0);
    } else if (input === 'h' || input === 'help') {
      help();
    } else if (input === 'clr' || input === 'clear') {
      clearEnv();
    } else if (input.startsWith('let ')) {
      input = input.replace(/let /, '');
      bindExpr(input);
    } else if (input.startsWith('e ') || input.startsWith('eval ')) {
      input = input.replace(/eval |e /, '');
      evalExpr(input);
    } else if (input.startsWith('b ') || input.startsWith('beta ')) {
      input = input.replace(/b |beta /, '');
      betaReduceExpr(input);
    } else if (input.startsWith('x ') || input.startsWith('expand ')) {
      input = input.replace(/x |expand /, '');
    } else if (input.startsWith('p ') || input.startsWith('parse ')) {
      input = input.replace(/parse |p /, '');
      parseExpr(input);
    }
  } else if (input.length > 0) {
    evalExpr(input);
  }
  rl.prompt();
});
