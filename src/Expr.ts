import Token, { Literal } from './Token';

export interface Visitor<R> {
  visitBinaryExpr: (expr: BinaryExpr) => R;
  visitGroupingExpr: (expr: GroupingExpr) => R;
  visitLiteralExpr: (expr: LiteralExpr) => R;
  visitUnaryExpr: (expr: UnaryExpr) => R;
}

export abstract class Expr {
  abstract accept: <R>(visitor: Visitor<R>) => R;
}

export class BinaryExpr implements Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class GroupingExpr implements Expr {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class LiteralExpr implements Expr {
  value: Literal;

  constructor(value: Literal) {
    this.value = value;
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class UnaryExpr implements Expr {
  operator: Token;
  right: Expr;

  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right;
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

