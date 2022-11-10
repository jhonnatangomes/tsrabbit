import { RuntimeError, runtimeError } from './Error';
import {
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  TernaryExpr,
  UnaryExpr,
} from './Expr';
import Token, { Literal } from './Token';
import { TokenType } from './TokenType';

export default class Interpreter implements ExprVisitor<Literal> {
  source: string;

  constructor(source: string) {
    this.source = source;
  }

  interpret = (expr: Expr) => {
    try {
      return this.evaluate(expr);
    } catch (error) {
      runtimeError(error as RuntimeError, this.source);
      return null;
    }
  };

  private evaluate = (expr: Expr) => {
    return expr.accept(this);
  };

  //visitors
  visitBinaryExpr = (expr: BinaryExpr): Literal => {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL:
        return !(left === right);
      case TokenType.EQUAL_EQUAL:
        return left === right;
      case TokenType.GREATER:
        this.checkOperandsTypes(expr.operator, 'number', left, right);
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        this.checkOperandsTypes(expr.operator, 'number', left, right);
        return Number(left) >= Number(right);
      case TokenType.LESS:
        this.checkOperandsTypes(expr.operator, 'number', left, right);
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        this.checkOperandsTypes(expr.operator, 'number', left, right);
        return Number(left) <= Number(right);
      case TokenType.STAR:
        this.checkOperandsTypes(expr.operator, 'number', left, right);
        return Number(left) * Number(right);
      case TokenType.SLASH:
        this.checkOperandsTypes(expr.operator, 'number', left, right);
        return Number(left) / Number(right);
      case TokenType.MINUS:
        this.checkOperandsTypes(expr.operator, 'number', left, right);
        return Number(left) - Number(right);
      case TokenType.PLUS:
        if (typeof left === 'string' && typeof right === 'string') {
          return left + right;
        }
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        throw new RuntimeError(
          expr.operator,
          'Operands must be two numbers or two strings.'
        );
    }
    return null;
  };
  visitLiteralExpr = (expr: LiteralExpr): Literal => {
    return expr.value;
  };
  visitGroupingExpr = (expr: GroupingExpr): Literal => {
    return this.evaluate(expr.expression);
  };
  visitTernaryExpr = (expr: TernaryExpr): Literal => {
    if (this.isTruthy(this.evaluate(expr.condition))) {
      return this.evaluate(expr.trueBranch);
    }
    return this.evaluate(expr.falseBranch);
  };
  visitUnaryExpr = (expr: UnaryExpr): Literal => {
    const right = this.evaluate(expr.right);
    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkOperandsTypes(expr.operator, 'number', right);
        return -Number(right);
    }
    return null;
  };

  //helpers
  checkOperandsTypes = (
    operator: Token,
    type: 'string' | 'number',
    ...operands: Literal[]
  ) => {
    if (operands.every((operand) => typeof operand === type)) return;
    throw new RuntimeError(
      operator,
      operands.length > 1
        ? `Operands must be ${type}s`
        : `Operand must be a ${type}`
    );
  };
  isTruthy = (value: Literal) => {
    if (value === null || value === false) return false;
    return true;
  };
}
