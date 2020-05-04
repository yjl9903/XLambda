import readline from 'readline';

import { parse } from './lambda';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.prompt();

rl.on('line', (input: string) => {
  input = input.trim();
  try {
    if (input.length > 0) {
      const output = parse(input);
      console.log(output);
    }
  } catch (err) {
    console.log(err);
  } finally {
    rl.prompt();
  }
});
