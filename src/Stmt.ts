import { Expr } from './Expr';
import Token from './Token';

export interface StmtVisitor<R> {
  visitExpressionStmt: (stmt: ExpressionStmt) => R;
  visitIfStmt: (stmt: IfStmt) => R;
  visitTypeStmt: (stmt: TypeStmt) => R;
  visitVarStmt: (stmt: VarStmt) => R;
}

export abstract class Stmt {
  abstract accept: <R>(visitor: StmtVisitor<R>) => R;
  abstract toString: () => Record<string, unknown>;
}

export class ExpressionStmt implements Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }

  toString() {
    return {
      expression: this.expression.toString(),
    };
  }
}

export class IfStmt implements Stmt {
  ifCondition: Expr;
  elseIfConditions: Expr[];
  thenBranch: Stmt;
  alternativeBranches: Stmt[];

  constructor(
    ifCondition: Expr,
    elseIfConditions: Expr[],
    thenBranch: Stmt,
    alternativeBranches: Stmt[]
  ) {
    this.ifCondition = ifCondition;
    this.elseIfConditions = elseIfConditions;
    this.thenBranch = thenBranch;
    this.alternativeBranches = alternativeBranches;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
  }

  toString() {
    return {
      ifCondition: this.ifCondition.toString(),
      elseIfConditions: this.elseIfConditions.toString(),
      thenBranch: this.thenBranch.toString(),
      alternativeBranches: this.alternativeBranches.toString(),
    };
  }
}

export class TypeStmt implements Stmt {
  name: Token;
  type: string;

  constructor(name: Token, type: string) {
    this.name = name;
    this.type = type;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitTypeStmt(this);
  }

  toString() {
    return {
      name: this.name.toString(),
      type: this.type.toString(),
    };
  }
}

export class VarStmt implements Stmt {
  type: string;
  name: Token;
  initializer: Expr;
  equalToken: Token;

  constructor(type: string, name: Token, initializer: Expr, equalToken: Token) {
    this.type = type;
    this.name = name;
    this.initializer = initializer;
    this.equalToken = equalToken;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }

  toString() {
    return {
      type: this.type.toString(),
      name: this.name.toString(),
      initializer: this.initializer.toString(),
      equalToken: this.equalToken.toString(),
    };
  }
}
