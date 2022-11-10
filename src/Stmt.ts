import { Expr } from './Expr';

export interface StmtVisitor<R> {
  visitExpressionStmt: (stmt: ExpressionStmt) => R;
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
