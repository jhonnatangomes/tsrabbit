import { runtimeError } from '.';
import { Callable } from './Callable';
import Environment from './Environment';
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  TernaryExpr,
  UnaryExpr,
  VariableExpr,
} from './Expr';
import Clock from './NativeFns/Clock';
import Print from './NativeFns/Print';
import RabbitFunction from './RabbitFunction';
import Return from './Return';
import RuntimeError from './RuntimeError';
import {
  BlockStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  ReturnStmt,
  Stmt,
  StmtVisitor,
  VarStmt,
  WhileStmt,
} from './Stmt';
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
  PIPE_PIPE,
  AMPERSAND_AMPERSAND,
} = TokenType;

export default class Interpreter
  implements ExprVisitor<Literal>, StmtVisitor<void>
{
  source: string;
  globals = new Environment();
  environment = this.globals;

  constructor(source: string) {
    this.source = source;
    this.globals.define('clock', new Clock());
    this.globals.define('print', new Print());
  }

  interpret(statements: Stmt[]) {
    try {
      statements.forEach((statement) => {
        this.execute(statement);
      });
    } catch (error) {
      runtimeError(error as RuntimeError, this.source);
    }
  }

  private execute(stmt: Stmt) {
    stmt.accept(this);
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

  visitTernaryExpr(expr: TernaryExpr): Literal {
    const condition = this.evaluate(expr.condition);
    if (this.isTruthy(condition)) {
      return this.evaluate(expr.trueBranch);
    }
    return this.evaluate(expr.falseBranch);
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression);
  }

  visitVarStmt(stmt: VarStmt): void {
    let value = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
  }

  visitVariableExpr(expr: VariableExpr): Literal {
    return this.environment.get(expr.name);
  }

  visitAssignExpr(expr: AssignExpr): Literal {
    const value = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  visitIfStmt(stmt: IfStmt): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
  }

  visitLogicalExpr(expr: LogicalExpr): Literal {
    const left = this.evaluate(expr.left);
    if (expr.operator.type === PIPE_PIPE) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }
    return this.evaluate(expr.right);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  visitCallExpr(expr: CallExpr): Literal {
    const callee = this.evaluate(expr.callee);
    const args: Literal[] = [];
    expr.args.forEach((arg) => args.push(this.evaluate(arg)));
    if (!(callee instanceof Callable)) {
      throw new RuntimeError(
        expr.paren,
        'Can only call functions and classes.'
      );
    }
    const func = callee as Callable;
    if (func.arity() !== Infinity && args.length !== func.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${func.arity()} arguments but got ${args.length}.`
      );
    }
    return func.call(this, args);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    const func = new RabbitFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, func);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    let value = null;
    if (stmt.value !== null) {
      value = this.evaluate(stmt.value);
    }
    throw new Return(value);
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previous = this.environment;
    try {
      this.environment = environment;
      statements.forEach(this.execute.bind(this));
    } finally {
      this.environment = previous;
    }
  }

  private isTruthy(value: Literal) {
    return !!value;
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
