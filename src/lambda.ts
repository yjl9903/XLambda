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
}

export enum Type {
  Expr = 'Expr',
  AbstractionList = 'AbstractionList',
  Application = 'Application',
  Term = 'Term',
}

export const lexer = new Lexer({
  tokens: [
    {
      type: Token.Lambda,
      rule: '\\\\|λ',
    },
    {
      type: Token.Identifier,
      rule: '[0-9a-zA-Z\\+\\*/=_~!@#$%^&]+',
    },
    {
      type: Token.Arrow,
      rule: '->|.',
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
  start: Type.Expr,
  productions: [
    {
      left: Type.Expr,
      right: [
        {
          rule: [Type.Term],
          reduce(term: BaseASTNode) {
            return term;
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
          rule: [Type.Application, Type.Term],
          reduce(term1: BaseASTNode, term2: BaseASTNode) {
            return new ApplicationASTNode(term1, term2);
          },
        },
        {
          rule: [Type.Term, Type.Term],
          reduce(term1: BaseASTNode, term2: BaseASTNode) {
            return new ApplicationASTNode(term1, term2);
          },
        },
      ],
    },
    {
      left: Type.Term,
      right: [
        {
          rule: [Token.Identifier],
          reduce(id: IToken) {
            return new VariableASTNode(id.value);
          },
        },
        {
          rule: [Token.LRound, Type.Expr, Token.RRound],
          reduce(L, expr: BaseASTNode) {
            return expr;
          },
        },
      ],
    },
  ],
});

export function parse(text: string) {
  try {
    const tokens = lexer.run(text);
    try {
      const result = parser.parse(tokens);
      if (result.ok) {
        return result.value as BaseASTNode;
      } else {
        throw new Error(JSON.stringify(result.token, null, 2));
      }
    } catch (error) {
      if (error instanceof SemanticError) {
        throw new Error('[Semantic Error]:\n' + error.message);
      } else {
        throw new Error('[Parse Error]:\n' + error.message);
      }
    }
  } catch (error) {
    if (error.message.startsWith('[')) {
      throw error;
    } else {
      throw new Error('[Lex Error]:\n' + error.message);
    }
  }
}

class SemanticError extends Error {
  constructor(message: string) {
    super(message);
  }
}
