import Token, { Literal } from './Token';

type HashLiteral = Record<string, Expr>

export interface ExprVisitor<R> {
  visitArrayLiteralExpr: (expr: ArrayLiteralExpr) => R;
  visitAssignExpr: (expr: AssignExpr) => R;
  visitBinaryExpr: (expr: BinaryExpr) => R;
  visitCallExpr: (expr: CallExpr) => R;
  visitGroupingExpr: (expr: GroupingExpr) => R;
  visitHashLiteralExpr: (expr: HashLiteralExpr) => R;
  visitLiteralExpr: (expr: LiteralExpr) => R;
  visitLogicalExpr: (expr: LogicalExpr) => R;
  visitTernaryExpr: (expr: TernaryExpr) => R;
  visitUnaryExpr: (expr: UnaryExpr) => R;
  visitVariableExpr: (expr: VariableExpr) => R;
}

export abstract class Expr {
  abstract accept: <R>(visitor: ExprVisitor<R>) => R;
  abstract toString: () => Record<string, unknown>;
}

export class ArrayLiteralExpr implements Expr {
  value: Expr[];

  constructor(value: Expr[]) {
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitArrayLiteralExpr(this);
  }
  toString() {
    return {
      value: this.value.toString(),
    };
  }
}

export class AssignExpr implements Expr {
  name: Token;
  value: Expr;

  constructor(name: Token, value: Expr) {
    this.name = name;
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
  toString() {
    return {
      name: this.name.toString(),
      value: this.value.toString(),
    };
  }
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

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
  toString() {
    return {
      left: this.left.toString(),
      operator: this.operator.toString(),
      right: this.right.toString(),
    };
  }
}

export class CallExpr implements Expr {
  callee: Expr;
  paren: Token;
  args: Expr[];

  constructor(callee: Expr, paren: Token, args: Expr[]) {
    this.callee = callee;
    this.paren = paren;
    this.args = args;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitCallExpr(this);
  }
  toString() {
    return {
      callee: this.callee.toString(),
      paren: this.paren.toString(),
      args: this.args.toString(),
    };
  }
}

export class GroupingExpr implements Expr {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
  toString() {
    return {
      expression: this.expression.toString(),
    };
  }
}

export class HashLiteralExpr implements Expr {
  value: HashLiteral;

  constructor(value: HashLiteral) {
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitHashLiteralExpr(this);
  }
  toString() {
    return {
      value: this.value.toString(),
    };
  }
}

export class LiteralExpr implements Expr {
  value: Literal;

  constructor(value: Literal) {
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
  toString() {
    return {
      value: this.value,
    };
  }
}

export class LogicalExpr implements Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLogicalExpr(this);
  }
  toString() {
    return {
      left: this.left.toString(),
      operator: this.operator.toString(),
      right: this.right.toString(),
    };
  }
}

export class TernaryExpr implements Expr {
  condition: Expr;
  trueBranch: Expr;
  falseBranch: Expr;

  constructor(condition: Expr, trueBranch: Expr, falseBranch: Expr) {
    this.condition = condition;
    this.trueBranch = trueBranch;
    this.falseBranch = falseBranch;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitTernaryExpr(this);
  }
  toString() {
    return {
      condition: this.condition.toString(),
      trueBranch: this.trueBranch.toString(),
      falseBranch: this.falseBranch.toString(),
    };
  }
}

export class UnaryExpr implements Expr {
  operator: Token;
  right: Expr;

  constructor(operator: Token, right: Expr) {
    this.operator = operator;
    this.right = right;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
  toString() {
    return {
      operator: this.operator.toString(),
      right: this.right.toString(),
    };
  }
}

export class VariableExpr implements Expr {
  name: Token;

  constructor(name: Token) {
    this.name = name;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
  toString() {
    return {
      name: this.name.toString(),
    };
  }
}

