import { cloneDeep } from 'lodash';

export enum ASTNodeType {
  Variable = 'Variable',
  Abstraction = 'Abstraction',
  Application = 'Application',
}

export abstract class BaseASTNode {
  type: ASTNodeType;

  constructor(type: ASTNodeType) {
    this.type = type;
  }

  abstract toString(): string;

  /**
   * Rename free variable "from" into "to"
   * Ensure that "to" does not occur in expr
   *
   * @abstract
   * @param {string} from
   * @param {string} to
   * @memberof BaseASTNode
   */
  abstract alphaRename(from: string, to: string): void;

  /**
   * Collect all the variables that may occur free in subtree
   *
   * @abstract
   * @param {Set<string>} free
   * @param {Map<string, number>} bound
   * @memberof BaseASTNode
   */
  abstract collectFreeNames(
    free: Set<string>,
    bound: Map<string, number>
  ): void;

  /**
   * Substitute free variable "from" into Node "to"
   *
   * @abstract
   * @param {string} from
   * @param {BaseASTNode} to
   * @returns {BaseASTNode}
   * @memberof BaseASTNode
   */
  abstract substitute(from: string, to: BaseASTNode): BaseASTNode;

  abstract doNormOrderRedex({ done: boolean }, bound: Map<string, number>): BaseASTNode | undefined;

  abstract expand(
    bound: Map<string, number>,
    bindNodes: Map<string, BaseASTNode>
  ): BaseASTNode;
}

export class VariableASTNode extends BaseASTNode {
  name: string;

  constructor(name: string) {
    super(ASTNodeType.Variable);
    this.name = name;
  }

  toString() {
    return this.name;
  }

  alphaRename(from: string, to: string) {
    if (from === this.name) {
      this.name = to;
    }
  }

  collectFreeNames(free: Set<string>, bound: Map<string, number>) {
    const occurTime = bound.get(this.name);
    if (occurTime === undefined || occurTime === 0) {
      free.add(this.name);
    }
  }

  substitute(from: string, to: BaseASTNode) {
    if (from === this.name) {
      return cloneDeep(to);
    } else {
      return this;
    }
  }

  doNormOrderRedex() {
    return undefined;
  }

  expand(bound: Map<string, number>, bindNodes: Map<string, BaseASTNode>) {
    if (!bound.has(this.name) || bound.get(this.name) === 0) {
      if (bindNodes.has(this.name)) {
        return cloneDeep(bindNodes.get(this.name) as BaseASTNode).expand(
          bound,
          bindNodes
        );
      } else {
        return this;
      }
    } else {
      return this;
    }
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

  toString() {
    return `λ ${this.parameter.name} -> ${this.body.toString()}`;
  }

  alphaRename(from: string, to: string) {
    if (this.parameter.name === from) {
      this.body.alphaRename(from, to);
    }
  }

  collectFreeNames(free: Set<string>, bound: Map<string, number>) {
    const occurTime = bound.get(this.parameter.name) || 0;
    bound.set(this.parameter.name, occurTime + 1);
    this.body.collectFreeNames(free, bound);
    if (occurTime > 0) {
      bound.set(this.parameter.name, occurTime);
    } else {
      bound.delete(this.parameter.name);
    }
  }

  substitute(from: string, to: BaseASTNode) {
    if (this.parameter.name === from) {
      // variable "from" is bound in this scope
      return this;
    } else {
      // ensure that parameter does not occur free in Node "to"
      const freeName = new Set<string>();
      to.collectFreeNames(freeName, new Map()); // TODO: collect current scope bindings
      let name = this.parameter.name;
      if (!freeName.has(name)) {
        return new AbstractionASTNode(
          new VariableASTNode(name),
          this.body.substitute(from, to)
        );
      } else {
        name += '_';
        while (freeName.has(name) || name === from) {
          name += '_';
        }
        // TODO: check name is not occur in "body" and "to".
        this.body.alphaRename(this.parameter.name, name);
        return new AbstractionASTNode(
          new VariableASTNode(name),
          this.body.substitute(from, to)
        );
      }
    }
  }

  doReduce(argument: BaseASTNode, bound: Map<string, number>) {
    const freeName = new Set<string>();
    argument.collectFreeNames(freeName, bound);
    let name = this.parameter.name;
    if (!freeName.has(name)) {
      return this.body.substitute(this.parameter.name, argument);
    } else {
      name += '_';
      while (freeName.has(name)) {
        name += '_';
      }
      // TODO: check name is not occur in "body" and "to".
      this.body.alphaRename(this.parameter.name, name);
      return this.body.substitute(this.parameter.name, argument);
    }
  }

  doNormOrderRedex(flag: { done: boolean }, bound: Map<string, number>) {
    const occurTime = bound.get(this.parameter.name) || 0;
    bound.set(this.parameter.name, occurTime + 1);
    const nBody = this.body.doNormOrderRedex(flag, bound);
    if (occurTime > 0) {
      bound.set(this.parameter.name, occurTime);
    } else {
      bound.delete(this.parameter.name);
    }
    if (nBody !== undefined) {
      this.body = nBody;
    }
    return undefined;
  }

  expand(bound: Map<string, number>, bindNodes: Map<string, BaseASTNode>) {
    const occurTime = bound.get(this.parameter.name) || 0;
    bound.set(this.parameter.name, occurTime + 1);
    const body = this.body.expand(bound, bindNodes);
    if (occurTime > 0) {
      bound.set(this.parameter.name, occurTime);
    } else {
      bound.delete(this.parameter.name);
    }
    return new AbstractionASTNode(this.parameter, body);
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

  toString() {
    const lhs =
      this.fn instanceof ApplicationASTNode ||
      this.fn instanceof AbstractionASTNode
        ? `(${this.fn.toString()})`
        : this.fn.toString();
    const rhs =
      this.argument instanceof ApplicationASTNode ||
      this.argument instanceof AbstractionASTNode
        ? `(${this.argument.toString()})`
        : this.argument.toString();
    return lhs + ' ' + rhs;
  }

  alphaRename(from: string, to: string) {
    this.fn.alphaRename(from, to);
    this.argument.alphaRename(from, to);
  }

  collectFreeNames(free: Set<string>, bound: Map<string, number>) {
    this.fn.collectFreeNames(free, bound);
    this.argument.collectFreeNames(free, bound);
  }

  substitute(from: string, to: BaseASTNode) {
    return new ApplicationASTNode(
      this.fn.substitute(from, to),
      this.argument.substitute(from, to)
    );
  }

  doNormOrderRedex(flag: { done: boolean }, bound: Map<string, number>) {
    if (this.fn instanceof AbstractionASTNode) {
      flag.done = true;
      return this.fn.doReduce(this.argument, bound);
    }
    const lhs = this.fn.doNormOrderRedex(flag, bound);
    if (lhs !== undefined) {
      this.fn = lhs;
    } else if (!flag.done) {
      const rhs = this.argument.doNormOrderRedex(flag, bound);
      if (rhs !== undefined) {
        this.argument = rhs;
      }
    }
  }

  expand(bound: Map<string, number>, bindNodes: Map<string, BaseASTNode>) {
    return new ApplicationASTNode(
      this.fn.expand(bound, bindNodes),
      this.argument.expand(bound, bindNodes)
    );
  }
}

export function doNormOrderRedex(root: BaseASTNode, flag: { done: boolean }) {
  if (
    root instanceof ApplicationASTNode &&
    root.fn instanceof AbstractionASTNode
  ) {
    flag.done = true;
    return root.fn.doReduce(root.argument, new Map());
  }
  root.doNormOrderRedex(flag, new Map());
  return root;
}

export function expand(root: BaseASTNode, bindNodes: Map<string, BaseASTNode>) {
  return root.expand(new Map(), bindNodes);
}

export function evaluate(root: BaseASTNode, bindNodes?: Map<string, BaseASTNode>) {
  const flag = { done: false };
  let ans = bindNodes ? expand(root, bindNodes) : root,
    depth = 0;
  do {
    flag.done = false;
    ans = doNormOrderRedex(ans, flag);
    depth++;
  } while (flag.done && depth < 100);
  return ans;
}
