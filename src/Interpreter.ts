import { runtimeError } from '.';
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  Visitor,
} from './Expr';
import RuntimeError from './RuntimeError';
import Token, { Literal } from './Token';
import { TokenType } from './TokenType';

const {
  MINUS,
  SLASH,
  STAR,
  GREATER,
  GREATER_EQUAL,
  LESS,
  LESS_EQUAL,
  BANG_EQUAL,
  EQUAL_EQUAL,
  PLUS,
  BANG,
} = TokenType;

export default class Interpreter implements Visitor<Literal> {
  source: string;

  constructor(source: string) {
    this.source = source;
  }

  interpret(expr: Expr) {
    try {
      const value = this.evaluate(expr);
      console.log(this.stringify(value));
    } catch (error) {
      runtimeError(error as RuntimeError, this.source);
    }
  }

  private stringify(value: Literal) {
    if (value === null) return 'nil';
    if (typeof value === 'number') {
      const text = value.toString();
      if (text.endsWith('.0')) {
        return text.replace('.0', '');
      }
      return text;
    }

    return value;
  }

  private evaluate(expr: Expr) {
    return expr.accept(this);
  }

  visitLiteralExpr(expr: LiteralExpr): Literal {
    return expr.value;
  }

  visitGroupingExpr(expr: GroupingExpr): Literal {
    return this.evaluate(expr.expression);
  }

  visitUnaryExpr(expr: UnaryExpr): Literal {
    const right = this.evaluate(expr.right);
    switch (expr.operator.type) {
      case MINUS:
        this.checkNumberOperands(expr.operator, right);
        return -Number(right);
      case BANG:
        return !this.isTruthy(right);
    }
    return null;
  }

  visitBinaryExpr(expr: BinaryExpr): Literal {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);
    switch (expr.operator.type) {
      case GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);
      case MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);
      case SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) / Number(right);
      case STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
      case BANG_EQUAL:
        return !this.isEqual(left, right);
      case EQUAL_EQUAL:
        return this.isEqual(left, right);
      case PLUS:
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
  }

  private isTruthy(value: Literal) {
    if (value === null || value === false) return false;
    return true;
  }

  private isEqual(a: Literal, b: Literal) {
    return a === b;
  }

  private checkNumberOperands(operator: Token, ...operands: Literal[]) {
    if (operands.every((operand) => typeof operand === 'number')) return;
    throw new RuntimeError(
      operator,
      operands.length > 1
        ? 'Operands must be numbers.'
        : 'Operand must be a number.'
    );
  }
}
