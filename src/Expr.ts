import Token, { Literal } from './Token';

export interface Visitor<R> {
  visitBinaryExpr: (expr: BinaryExpr<R>) => R;
  visitGroupingExpr: (expr: GroupingExpr<R>) => R;
  visitLiteralExpr: (expr: LiteralExpr<R>) => R;
  visitUnaryExpr: (expr: UnaryExpr<R>) => R;
}

abstract class Expr<R> {
  abstract accept: (visitor: Visitor<R>) => R;
}

export class BinaryExpr<R> implements Expr<R> {
  left: Expr<R>;
  operator: Token;
  right: Expr<R>;

  constructor(left: Expr<R>, operator: Token, right: Expr<R>) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept(visitor: Visitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class GroupingExpr<R> implements Expr<R> {
  expression: Expr<R>;

  constructor(expression: Expr<R>) {
    this.expression = expression;
  }

  accept(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class LiteralExpr<R> implements Expr<R> {
  value: Literal;

  constructor(value: Literal) {
    this.value = value;
  }

  accept(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class UnaryExpr<R> implements Expr<R> {
  operator: Token;
  right: Expr<R>;

  constructor(operator: Token, right: Expr<R>) {
    this.operator = operator;
    this.right = right;
  }

  accept(visitor: Visitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

