import { parse } from './lambda';
import { BaseASTNode, doNormOrderRedex, evaluate, expand } from './ast';

export function help() {}

const bindTexts = new Map<string, string>();
const bindNodes = new Map<string, BaseASTNode>();

export function clearEnv() {
  bindTexts.clear();
  bindNodes.clear();
}

export function bindExpr(input: string) {
  if (!input.includes('=')) {
    console.log("[REPL Error]: bind command does not have '='");
    return;
  }
  const eqPos = input.indexOf('=');
  const name = input.substr(0, eqPos).trim();
  if (name.length === 0) {
    console.log('[REPL Error]: bind name can not be empty');
    return;
  }
  const exprText = input
    .substr(eqPos + 1)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(\\|λ)\s?/g, 'λ ')
    .replace(/\s?->\s?/, ' -> ');
  try {
    const expr = parse(exprText);
    bindTexts.set(name, exprText);
    bindNodes.set(name, expr);
    console.log(`bind ${name} => ${expr.toString()}`);
  } catch (err) {
    console.log(err.message);
  }
}

export function parseExpr(input: string) {
  try {
    const output = parse(input);
    console.log(JSON.stringify(output, null, 2));
  } catch (err) {
    console.log(err.message);
  }
}

export function betaReduceExpr(input: string) {
  try {
    const root = expand(parse(input), bindNodes);
    const flag = { done: false };
    const bRoot = doNormOrderRedex(root, flag);
    console.log(bRoot.toString());
  } catch (err) {
    console.log(err.message);
  }
}

export function evalExpr(input: string) {
  try {
    const root = expand(parse(input), bindNodes);
    const eRoot = evaluate(root);
    console.log(eRoot.toString());
  } catch (err) {
    console.log(err.message);
  }
}
