export enum ASTNodeType {
  Variable = 'Variable',
  Abstraction = 'Abstraction',
  Application = 'Application',
}

export class BaseASTNode {
  type: ASTNodeType;

  constructor(type: ASTNodeType) {
    this.type = type;
  }
}

export class VariableASTNode extends BaseASTNode {
  name: string;

  constructor(name: string) {
    super(ASTNodeType.Variable);
    this.name = name;
  }
}

export class AbstractionASTNode extends BaseASTNode {
  parameter: VariableASTNode;
  body: BaseASTNode;

  constructor(parameter: VariableASTNode, body: BaseASTNode) {
    super(ASTNodeType.Abstraction);
    this.parameter = parameter;
    this.body = body;
  }
}

export class ApplicationASTNode extends BaseASTNode {
  fn: BaseASTNode;
  argument: BaseASTNode;

  constructor(fn: BaseASTNode, argument: BaseASTNode) {
    super(ASTNodeType.Application);
    this.fn = fn;
    this.argument = argument;
  }
}
