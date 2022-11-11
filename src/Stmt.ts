import { Expr } from './Expr';
import Token from './Token';

export interface StmtVisitor<R> {
  visitExpressionStmt: (stmt: ExpressionStmt) => R;
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
    }
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
    }
  }
}

