import { tokenError } from './Error';
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
import Interpreter from './Interpreter';
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
import Token from './Token';

export default class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private interpreter: Interpreter;
  private source: string;
  private scopes: Record<string, boolean>[] = [];
  private isInsideFunction = false;
  constructor(interpreter: Interpreter, source: string) {
    this.interpreter = interpreter;
    this.source = source;
  }
  visitForInStmt(stmt: ForInStmt): void {
    this.beginScope();
    stmt.initializers.forEach((initializer, i) => {
      const initializerToken = stmt.initializerTokens[i];
      this.declare(initializerToken);
      this.define(initializerToken);
      this.resolveLocal(initializerToken, initializer);
    });
    this.resolveStmt(stmt.body);
    this.resolveExpr(stmt.iterable);
    this.endScope();
  }
  visitArrayLiteralExpr(expr: ArrayLiteralExpr): void {
    for (const el of expr.value) {
      this.resolveExpr(el);
    }
  }
  visitHashLiteralExpr(expr: HashLiteralExpr): void {
    Object.values(expr.value).map((value) =>
      this.resolveExpr.bind(this)(value)
    );
  }
  visitIndexAccessExpr(expr: IndexAccessExpr): void {
    if (
      this.scopes.length !== 0 &&
      this.scopes.at(-1)?.[expr.token.lexeme] === false
    ) {
      tokenError(
        expr.token,
        "Can't read local variable in its own initializer.",
        this.source
      );
    }
    this.resolveLocal(expr.token, expr);
    for (const accessor of expr.accessors) {
      this.resolveExpr(accessor);
    }
  }
  visitLambdaExpr(expr: LambdaExpr): void {
    const enclosingFunction = this.isInsideFunction;
    this.isInsideFunction = true;
    this.beginScope();
    for (const param of expr.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolveStmt(expr.body);
    this.endScope();
    this.isInsideFunction = enclosingFunction;
  }
  visitTernaryExpr(expr: TernaryExpr): void {
    this.resolveExpr(expr.condition);
    this.resolveExpr(expr.trueBranch);
    this.resolveExpr(expr.falseBranch);
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.resolveStmt(stmt.statements);
    this.endScope();
  }

  visitVarStmt(stmt: VarStmt): void {
    this.declare(stmt.name);
    if (stmt.initializer !== null) {
      this.resolveExpr(stmt.initializer);
    }
    this.define(stmt.name);
  }

  visitVariableExpr(expr: VariableExpr): void {
    if (
      this.scopes.length !== 0 &&
      this.scopes.at(-1)?.[expr.name.lexeme] === false
    ) {
      tokenError(
        expr.name,
        "Can't read local variable in its own initializer.",
        this.source
      );
    }
    this.resolveLocal(expr.name, expr);
  }

  visitAssignExpr(expr: AssignExpr): void {
    this.resolveExpr(expr.value);
    this.resolveLocal(expr.name, expr);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, true);
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.resolveExpr(stmt.expression);
  }

  visitIfStmt(stmt: IfStmt): void {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.thenBranch);
    if (stmt.elseBranch !== null) this.resolveStmt(stmt.elseBranch);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (!this.isInsideFunction)
      tokenError(
        stmt.keyword,
        "Can't return from top-level code.",
        this.source
      );
    if (stmt.value !== null) {
      this.resolveExpr(stmt.value);
    }
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.body);
  }

  visitBinaryExpr(expr: BinaryExpr): void {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  visitCallExpr(expr: CallExpr): void {
    this.resolveExpr(expr.callee);
    for (const argument of expr.args) {
      this.resolveExpr(argument);
    }
  }

  visitGroupingExpr(expr: GroupingExpr): void {
    this.resolveExpr(expr.expression);
  }

  visitLiteralExpr(_expr: LiteralExpr): void {}

  visitLogicalExpr(expr: LogicalExpr): void {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  visitUnaryExpr(expr: UnaryExpr): void {
    this.resolveExpr(expr.right);
  }

  resolveFunction(fn: FunctionStmt, isInsideFunction: boolean) {
    const enclosingFunction = this.isInsideFunction;
    this.isInsideFunction = isInsideFunction;
    this.beginScope();
    for (const param of fn.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolveStmt(fn.body);
    this.endScope();
    this.isInsideFunction = enclosingFunction;
  }

  resolveLocal(name: Token, expr: Expr) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (Object.keys(this.scopes[i]).includes(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }

  declare(name: Token) {
    if (this.scopes.length === 0) return;
    const scope = this.scopes.at(-1);
    if (scope) {
      scope[name.lexeme] = false;
    }
  }

  define(name: Token) {
    if (this.scopes.length === 0) return;
    const scope = this.scopes.at(-1);
    if (scope) {
      scope[name.lexeme] = true;
    }
  }

  resolveStmt(statements: Stmt[] | Stmt) {
    if (!Array.isArray(statements)) {
      return statements.accept(this);
    }
    for (const statement of statements) {
      statement.accept(this);
    }
  }
  resolveExpr(expr: Expr) {
    expr.accept(this);
  }

  beginScope() {
    this.scopes.push({});
  }

  endScope() {
    this.scopes.pop();
  }
}
