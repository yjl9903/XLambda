import { parse } from '../src/lambda';

test('Basic () => parse', () => {
  expect(() => parse('λ S Z -> Z')).not.toThrow();
  expect(() => parse('λ S Z -> S Z')).not.toThrow();
  expect(() => parse('λ S Z -> S (S Z)')).not.toThrow();
  expect(() => parse('λ S Z -> S (S (S Z))')).not.toThrow();
  expect(() => parse('λ S Z -> S (S (S (S Z)))')).not.toThrow();

  expect(() => parse('add = λ S Z x y -> x S (y S Z)')).not.toThrow();

  expect(() => parse('True = λ x y -> x')).not.toThrow();
  expect(() => parse('False = λ x y -> y')).not.toThrow();

  expect(() =>
    parse(
      'IfThenElse = λ condition True_Expr False_Expr -> cond True_Expr False_Expr'
    )
  ).not.toThrow();
  expect(() => parse('BoolNot = λ x -> x False True')).not.toThrow();
  expect(() =>
    parse('BoolAnd = λ x y -> x (y True False) False')
  ).not.toThrow();
  expect(() =>
    parse('BoolOr = λ x  y -> x True (y True False)')
  ).not.toThrow();

  expect(() =>
    parse('Y = λ y -> (λ x -> y (x x)) (λ x -> y (x x))')
  ).not.toThrow();
});
