import { Expr } from './Expr';
import Token from './Token';

export interface StmtVisitor<R> {
  visitBlockStmt: (stmt: BlockStmt) => R;
  visitExpressionStmt: (stmt: ExpressionStmt) => R;
  visitFunctionStmt: (stmt: FunctionStmt) => R;
  visitIfStmt: (stmt: IfStmt) => R;
  visitReturnStmt: (stmt: ReturnStmt) => R;
  visitWhileStmt: (stmt: WhileStmt) => R;
  visitVarStmt: (stmt: VarStmt) => R;
}

export abstract class Stmt {
  abstract accept: <R>(visitor: StmtVisitor<R>) => R;
  abstract toString: () => Record<string, unknown>;
}

export class BlockStmt implements Stmt {
  statements: Stmt[];

  constructor(statements: Stmt[]) {
    this.statements = statements;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
  toString() {
    return {
      statements: this.statements.toString(),
    };
  }
}

export class ExpressionStmt implements Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    this.expression = expression;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
  toString() {
    return {
      expression: this.expression.toString(),
    };
  }
}

export class FunctionStmt implements Stmt {
  name: Token;
  params: Token[];
  body: Stmt[];

  constructor(name: Token, params: Token[], body: Stmt[]) {
    this.name = name;
    this.params = params;
    this.body = body;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitFunctionStmt(this);
  }
  toString() {
    return {
      name: this.name.toString(),
      params: this.params.toString(),
      body: this.body.toString(),
    };
  }
}

export class IfStmt implements Stmt {
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null) {
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
  }
  toString() {
    return {
      condition: this.condition.toString(),
      thenBranch: this.thenBranch.toString(),
      elseBranch: this.elseBranch?.toString(),
    };
  }
}

export class ReturnStmt implements Stmt {
  keyword: Token;
  value: Expr | null;

  constructor(keyword: Token, value: Expr | null) {
    this.keyword = keyword;
    this.value = value;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitReturnStmt(this);
  }
  toString() {
    return {
      keyword: this.keyword.toString(),
      value: this.value?.toString(),
    };
  }
}

export class WhileStmt implements Stmt {
  condition: Expr;
  body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    this.condition = condition;
    this.body = body;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
  toString() {
    return {
      condition: this.condition.toString(),
      body: this.body.toString(),
    };
  }
}

export class VarStmt implements Stmt {
  name: Token;
  initializer: Expr | null;

  constructor(name: Token, initializer: Expr | null) {
    this.name = name;
    this.initializer = initializer;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
  toString() {
    return {
      name: this.name.toString(),
      initializer: this.initializer?.toString(),
    };
  }
}

