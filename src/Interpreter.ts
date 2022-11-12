import Environment from './Environment';
import { RuntimeError, runtimeError } from './Error';
import {
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  TernaryExpr,
  UnaryExpr,
  VariableExpr,
} from './Expr';
import { getLiteralType } from './helpers';
import { ExpressionStmt, Stmt, StmtVisitor, TypeStmt, VarStmt } from './Stmt';
import Token, { Literal } from './Token';
import { TokenType } from './TokenType';

export default class Interpreter
  implements ExprVisitor<Literal>, StmtVisitor<Literal>
{
  source: string;
  globals: Environment;
  environment: Environment;

  constructor(source: string, globalEnv: Environment) {
    this.source = source;
    this.globals = globalEnv;
    this.environment = this.globals;
  }

  interpret = (statements: Stmt[]) => {
    try {
      return statements.map(this.execute);
    } catch (error) {
      runtimeError(error as RuntimeError, this.source);
      return null;
    }
  };

  private execute = (stmt: Stmt) => {
    return stmt.accept(this);
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
  visitLogicalExpr = (expr: LogicalExpr): Literal => {
    const left = this.evaluate(expr.left);
    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }
    return this.evaluate(expr.right);
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
  visitVariableExpr = (expr: VariableExpr): Literal => {
    const { name } = expr;
    return this.environment.get(name).literal;
  };

  visitExpressionStmt = (stmt: ExpressionStmt): Literal => {
    return this.evaluate(stmt.expression);
  };

  visitTypeStmt = (stmt: TypeStmt): Literal => {
    this.globals.assertType(stmt.name, stmt.type);
    this.environment.defineType(stmt.name, stmt.type);
    return null;
  };

  visitVarStmt = (stmt: VarStmt): Literal => {
    if (stmt.name.lexeme === stmt.type) {
      throw new RuntimeError(
        stmt.name,
        `Can't declare a variable with the same name as a type.`
      );
    }
    this.globals.assertType(stmt.equalToken, stmt.type);
    const initializer = this.evaluate(stmt.initializer);
    const initializerType = getLiteralType(initializer, stmt.equalToken);
    const stmtTypes = this.globals.getType(stmt.name, stmt.type);
    if (!stmtTypes.includes(initializerType)) {
      throw new RuntimeError(
        stmt.equalToken,
        `Tried to assign type ${initializerType} to type ${stmtTypes.join(
          ' | '
        )}`
      );
    }
    this.environment.define(stmt.name, initializer, initializerType);
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
