import { Lexer } from 'xlex';
import { LRParser } from '@yjl9903/xparse';
import {
  BaseASTNode,
  VariableASTNode,
  AbstractionASTNode,
  ApplicationASTNode,
} from './ast';
import { IToken } from 'xlex/types/lexer/type';

export enum Token {
  Lambda = 'Lambda',
  Identifier = 'Identifier',
  Arrow = 'Arrow',
  LRound = 'LRound',
  RRound = 'RRound',
  Assign = 'Assign',
}

export enum Type {
  Line = 'Line',
  Expr = 'Expr',
  AbstractionList = 'AbstractionList',
  Application = 'Application',
}

export const lexer = new Lexer({
  tokens: [
    {
      type: Token.Assign,
      rule: '=',
    },
    {
      type: Token.Lambda,
      rule: '\\\\|λ',
    },
    {
      type: Token.Identifier,
      rule: '[0-9a-zA-Z\\-\\+\\*/=_~!@#$%^&]+',
    },
    {
      type: Token.Arrow,
      rule: '->',
    },
    {
      type: Token.LRound,
      rule: '\\(',
    },
    {
      type: Token.RRound,
      rule: '\\)',
    },
  ],
});

export const parser = new LRParser({
  tokens: (Reflect.ownKeys(Token) as string[]).map((t) => Token[t]),
  types: (Reflect.ownKeys(Type) as string[]).map((t) => Type[t]),
  start: Type.Line,
  productions: [
    {
      left: Type.Line,
      right: [
        {
          rule: [Token.Identifier, Token.Assign, Type.Expr],
          reduce(id, assign, expr: BaseASTNode) {
            return expr;
          },
        },
        {
          rule: [Type.Expr],
          reduce(expr: BaseASTNode) {
            return expr;
          },
        },
      ],
    },
    {
      left: Type.Expr,
      right: [
        {
          rule: [Token.Identifier],
          reduce(id: IToken) {
            return new VariableASTNode(id.value);
          },
        },
        {
          rule: [Token.LRound, Type.Expr, Token.RRound],
          reduce(L, expr) {
            return expr;
          },
        },
        {
          rule: [
            Token.Lambda,
            Token.Identifier,
            Type.AbstractionList,
            Token.Arrow,
            Type.Expr,
          ],
          reduce(lambda, id: IToken, list: string[], arrow, expr: BaseASTNode) {
            const params = [...list, id.value];
            const root: AbstractionASTNode = params.reduce(
              (
                pre: AbstractionASTNode | undefined,
                param: string
              ): AbstractionASTNode =>
                pre == undefined
                  ? new AbstractionASTNode(new VariableASTNode(param), expr)
                  : new AbstractionASTNode(new VariableASTNode(param), pre),
              undefined
            );
            return root;
          },
        },
        {
          rule: [Type.Application],
          reduce(application) {
            return application;
          },
        },
      ],
    },
    {
      left: Type.AbstractionList,
      right: [
        {
          rule: [],
          reduce() {
            return [];
          },
        },
        {
          rule: [Token.Identifier, Type.AbstractionList],
          reduce(id: IToken, rest: string[]) {
            return [...rest, id.value];
          },
        },
      ],
    },
    {
      left: Type.Application,
      right: [
        {
          rule: [Token.Identifier, Type.Expr],
          reduce(id: IToken, expr: BaseASTNode) {
            return new ApplicationASTNode(new VariableASTNode(id.value), expr);
          },
        },
        {
          rule: [Token.LRound, Type.Expr, Token.RRound, Type.Expr],
          reduce(L, fn: BaseASTNode, R, expr: BaseASTNode) {
            return new ApplicationASTNode(fn, expr);
          },
        },
      ],
    },
  ],
});

export function parse(text: string) {
  const tokens = lexer.run(text);
  const result = parser.parse(tokens);
  if (result.ok) {
    return JSON.stringify(result.value, null, 2);
  } else {
    throw new Error(result.token);
  }
}
