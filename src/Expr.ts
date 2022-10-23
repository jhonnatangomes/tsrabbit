import Token, { Literal } from './Token';

export interface Visitor<R> {
  visitBinaryExpr: <R>(expr: BinaryExpr) => R;
  visitGroupingExpr: <R>(expr: GroupingExpr) => R;
  visitLiteralExpr: <R>(expr: LiteralExpr) => R;
  visitPrefixUnaryExpr: <R>(expr: PrefixUnaryExpr) => R;
  visitPostfixUnaryExpr: <R>(expr: PostfixUnaryExpr) => R;
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

export class PrefixUnaryExpr implements Expr {
  operator: Token;
  right: Expr;

  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right;
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitPrefixUnaryExpr(this);
  }
}

export class PostfixUnaryExpr implements Expr {
  left: Expr;
  operator: Token;

  constructor(left: Expr, operator: Token) {
    this.left = left;
    this.operator = operator;
  }

  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitPostfixUnaryExpr(this);
  }
}

