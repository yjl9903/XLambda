import { parse } from '../src/lambda';
import { evaluate, BaseASTNode } from '../src/ast';

test('Basic () => parse', () => {
  expect(() => parse('λ S Z -> Z')).not.toThrow();
  expect(() => parse('λ S Z -> S Z')).not.toThrow();
  expect(() => parse('λ S Z -> S (S Z)')).not.toThrow();
  expect(() => parse('λ S Z -> S (S (S Z))')).not.toThrow();
  expect(() => parse('λ S Z -> S (S (S (S Z)))')).not.toThrow();

  expect(() => parse('λ S Z x y -> x S (y S Z)')).not.toThrow();

  expect(() => parse('λ x y -> x')).not.toThrow();
  expect(() => parse('λ x y -> y')).not.toThrow();

  expect(() =>
    parse(
      'λ condition True_Expr False_Expr -> cond True_Expr False_Expr'
    )
  ).not.toThrow();
  expect(() => parse('λ x -> x False True')).not.toThrow();
  expect(() =>
    parse('λ x y -> x (y True False) False')
  ).not.toThrow();
  expect(() => parse('λ x  y -> x True (y True False)')).not.toThrow();

  expect(() =>
    parse('λ y -> (λ x -> y (x x)) (λ x -> y (x x))')
  ).not.toThrow();
});

test('Eval', () => {
  expect(evaluate(parse('(λf.λx.f (f x)) (λf.λx.f (f x)) (λx.x) (λx.x)')).toString()).toBe('λ x -> x');
  expect(/λ \w+ -> y/.test(evaluate(parse('(λf.f (f x)) ((λx.λy.x) (λx.y))')).toString())).toBeTruthy();
});

test('Church Numerals', () => {
  const bindNodes = new Map<string, BaseASTNode>();
  expect(() => bindNodes.set('0', parse('λ s z -> z'))).not.toThrow();
  expect(() => bindNodes.set('succ', parse('λ x . λ s z . s (x s z)'))).not.toThrow();
  expect(() => bindNodes.set('1', evaluate(parse('succ 0'), bindNodes))).not.toThrow();
  expect(() => bindNodes.set('2', evaluate(parse('succ 1'), bindNodes))).not.toThrow();
  expect(() => bindNodes.set('3', evaluate(parse('succ 2'), bindNodes))).not.toThrow();

  expect(bindNodes.get('3')?.toString()).toBe('λ s -> λ z -> s (s (s z))');

  expect(() => bindNodes.set('add', parse('λ x y . λ s z . x s (y s z)'))).not.toThrow();
  expect(evaluate(parse('add 1 2'), bindNodes).toString()).toBe('λ s -> λ z -> s (s (s z))');
  
  expect(() => bindNodes.set('mul', parse('λ x y . x (add y) 0'))).not.toThrow();
  expect(evaluate(parse('mul 2 (succ 2)'), bindNodes).toString()).toBe('λ s -> λ z -> s (s (s (s (s (s z)))))');
});
