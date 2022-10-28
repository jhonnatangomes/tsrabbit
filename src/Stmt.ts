import { Expr } from './Expr';
import Token from './Token';

export interface StmtVisitor<R> {
  visitBlockStmt: (stmt: BlockStmt) => R;
  visitExpressionStmt: (stmt: ExpressionStmt) => R;
  visitIfStmt: (stmt: IfStmt) => R;
  visitWhileStmt: (stmt: WhileStmt) => R;
  visitVarStmt: (stmt: VarStmt) => R;
}

export abstract class Stmt {
  abstract accept: <R>(visitor: StmtVisitor<R>) => R;
}

export class BlockStmt implements Stmt {
  statements: Stmt[];

  constructor(statements: Stmt[]) {
    this.statements = statements;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
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
}

