import { Callable } from './Callable';
import Environment from './Environment';
import { runtimeError } from './Error';
import {
  ArrayLiteralExpr,
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  HashLiteralExpr,
  IndexAccessExpr,
  LambdaExpr,
  LiteralExpr,
  LogicalExpr,
  TernaryExpr,
  UnaryExpr,
  VariableExpr,
} from './Expr';
import { isObject } from './helpers';
import {
  Clock,
  Filter,
  Length,
  Map as MapBuiltin,
  Print,
  Push,
  Random,
  Range,
  Reduce,
  Slice,
} from './NativeFns';
import RabbitFunction from './RabbitFunction';
import Return from './Return';
import RuntimeError from './RuntimeError';
import {
  BlockStmt,
  ExpressionStmt,
  ForInStmt,
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
} = TokenType;

export type Locals = Map<Expr, number>;

export default class Interpreter
  implements ExprVisitor<Literal>, StmtVisitor<Literal>
{
  source: string;
  globals: Environment = new Environment();
  environment: Environment = this.globals;
  locals: Locals;

  interpret = (statements: Stmt[]) => {
    try {
      return statements.map(this.execute.bind(this));
    } catch (error) {
      runtimeError(error as RuntimeError, this.source);
      return null;
    }
  };

  constructor(source: string, globalEnv: Environment, locals?: Locals) {
    this.source = source;
    this.globals = globalEnv;
    this.locals = locals || new Map();
    this.environment = this.globals;
    if (!this.globals.values['clock']) {
      this.globals.define('clock', new Clock());
      this.globals.define('print', new Print());
      this.globals.define('random', new Random());
      this.globals.define('push', new Push());
      this.globals.define('length', new Length());
      this.globals.define('map', new MapBuiltin());
      this.globals.define('range', new Range());
      this.globals.define('reduce', new Reduce());
      this.globals.define('filter', new Filter());
      this.globals.define('slice', new Slice());
    }
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
  }

  private execute(stmt: Stmt) {
    return stmt.accept(this);
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
  visitArrayLiteralExpr(expr: ArrayLiteralExpr): Literal {
    const arrayValues = expr.value.map(this.evaluate.bind(this));
    return arrayValues;
  }
  visitHashLiteralExpr(expr: HashLiteralExpr): Literal {
    const hashValues = Object.fromEntries(
      Object.entries(expr.value).map(([k, v]) => [k, this.evaluate(v)])
    );
    return hashValues;
  }
  visitIndexAccessExpr(expr: IndexAccessExpr): Literal {
    let variable = this.lookupVariable(expr.token, expr);
    expr.accessors.forEach((accessor, i) => {
      const evaluatedAccessor = this.evaluate(accessor);
      if (Array.isArray(variable)) {
        if (typeof evaluatedAccessor === 'number') {
          const value = variable[evaluatedAccessor];
          if (value === undefined)
            throw new RuntimeError(
              expr.accessorsTokens[i],
              `Index ${evaluatedAccessor} out of range.`
            );
          variable = value;
          return;
        }
        throw new RuntimeError(
          expr.accessorsTokens[i],
          'Cannot access array with non-numerical index.'
        );
      }
      if (isObject(variable)) {
        if (typeof evaluatedAccessor === 'string') {
          const value = variable[evaluatedAccessor];
          if (value === undefined)
            throw new RuntimeError(
              expr.accessorsTokens[i],
              `Key ${evaluatedAccessor} does not exist in hash.`
            );
          variable = value;
          return;
        }
        throw new RuntimeError(
          expr.accessorsTokens[i],
          `Cannot access hash with non-string index.`
        );
      }
      throw new RuntimeError(
        expr.accessorsTokens[i],
        'Cannot access values that are not arrays or hashes with an index.'
      );
    });
    return variable;
  }

  visitLambdaExpr(expr: LambdaExpr): Literal {
    return new RabbitFunction(expr, this.environment);
  }

  visitExpressionStmt(stmt: ExpressionStmt): Literal {
    const value = this.evaluate(stmt.expression);
    return value instanceof RabbitFunction ? value.declaration.code : value;
  }

  visitVarStmt(stmt: VarStmt): Literal {
    let value = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name, value);
    return null;
  }
  visitForInStmt(stmt: ForInStmt): Literal {
    const { initializerTokens, iterable, body } = stmt;
    const outerEnvironment = this.environment;
    this.environment = new Environment(outerEnvironment);
    if (initializerTokens.length === 2) {
      this.environment.define(initializerTokens[1], 0);
    }
    const expression = this.evaluate(iterable);
    if (!Array.isArray(expression)) {
      throw new RuntimeError(
        initializerTokens[0],
        'Expression in for in loop needs to be an array.'
      );
    }
    this.environment.define(initializerTokens[0], expression[0]);
    expression.forEach((el, i) => {
      this.environment.assign(initializerTokens[0], el);
      this.execute(body);
      if (initializerTokens.length === 2) {
        this.environment.assign(initializerTokens[1], i + 1);
      }
    });
    this.environment = outerEnvironment;
    return null;
  }
  isIntegerNumber(x: unknown): x is number {
    return typeof x === 'number' && Number.isInteger(x);
  }
  visitVariableExpr(expr: VariableExpr): Literal {
    return this.lookupVariable(expr.name, expr);
  }

  private lookupVariable(name: Token, expr: Expr): Literal {
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name);
    } else {
      return this.globals.get(name);
    }
  }

  visitAssignExpr(expr: AssignExpr): Literal {
    const value = this.evaluate(expr.value);
    const distance = this.locals.get(expr);
    if (distance !== undefined) {
      if (expr.accessors) {
        const originalLiteral = this.environment.getAt(distance, expr.name);
        this.environment.assignAt(
          distance,
          expr.name,
          this.changeValueAtIndex(
            //@ts-ignore
            originalLiteral,
            expr.accessors.map(this.evaluate.bind(this)),
            value
          )
        );
      } else {
        this.environment.assignAt(distance, expr.name, value);
      }
    } else {
      if (expr.accessors) {
        const originalLiteral = this.globals.get(expr.name);
        this.globals.assign(
          expr.name,
          this.changeValueAtIndex(
            //@ts-ignore
            originalLiteral,
            expr.accessors.map(this.evaluate.bind(this)),
            value
          )
        );
        this.globals.assign(expr.name, originalLiteral);
      } else {
        this.globals.assign(expr.name, value);
      }
    }
    return value;
  }

  changeValueAtIndex(
    literal: unknown[] | Record<string, unknown>,
    indexes: (number | string)[],
    value: Literal
  ) {
    if (indexes.length === 0) return value;
    const path = indexes[0];
    //@ts-ignore
    const nextObj = literal[path];
    //@ts-ignore
    literal[path] = this.changeValueAtIndex(nextObj, indexes.slice(1), value);
    return literal;
  }

  visitBlockStmt(stmt: BlockStmt): Literal {
    this.executeBlock(stmt.statements, new Environment(this.environment));
    return null;
  }

  visitIfStmt(stmt: IfStmt): Literal {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
    return null;
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

  visitWhileStmt(stmt: WhileStmt): Literal {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
    return null;
  }

  visitCallExpr(expr: CallExpr): Literal {
    const callee = this.evaluate(expr.callee);
    const args: Literal[] = [];
    expr.args.forEach((arg) => args.push(this.evaluate(arg)));
    if (!(callee instanceof Callable)) {
      throw new RuntimeError(expr.paren, 'Can only call functions.');
    }
    const func = callee as Callable;
    if (func.arity() !== Infinity && args.length !== func.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${func.arity()} arguments but got ${args.length}.`
      );
    }
    return func.call(this, args, expr.paren);
  }

  visitFunctionStmt(stmt: FunctionStmt): Literal {
    const func = new RabbitFunction(stmt, this.environment);
    this.environment.define(stmt.name, func);
    return null;
  }

  visitReturnStmt(stmt: ReturnStmt): Literal {
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
