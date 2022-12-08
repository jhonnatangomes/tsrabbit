import { ParseError, tokenError } from './Error';
import {
  ArrayLiteralExpr,
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GroupingExpr,
  HashLiteralExpr,
  IndexAccessExpr,
  LiteralExpr,
  LogicalExpr,
  TernaryExpr,
  UnaryExpr,
  VariableExpr,
} from './Expr';
import {
  BlockStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  ReturnStmt,
  Stmt,
  VarStmt,
  WhileStmt,
} from './Stmt';
import Token from './Token';
import { TokenType } from './TokenType';

const {
  BANG_EQUAL,
  EQUAL_EQUAL,
  EOF,
  LESS,
  FALSE,
  TRUE,
  NIL,
  NUMBER,
  STRING,
  LEFT_PAREN,
  RIGHT_PAREN,
  BANG,
  MINUS,
  PLUS,
  SLASH,
  STAR,
  LESS_EQUAL,
  GREATER,
  GREATER_EQUAL,
  SEMICOLON,
  FUN,
  VAR,
  FOR,
  IF,
  WHILE,
  RETURN,
  QUESTION,
  COLON,
  IDENTIFIER,
  EQUAL,
  LEFT_BRACE,
  RIGHT_BRACE,
  ELSE,
  PIPE_PIPE,
  AMPERSAND_AMPERSAND,
  COMMA,
  LEFT_BRACKET,
  RIGHT_BRACKET,
} = TokenType;

export default class Parser {
  tokens: Token[];
  source: string;
  private current = 0;
  constructor(tokens: Token[], source: string) {
    this.tokens = tokens;
    this.source = source;
  }

  parse() {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      const declaration = this.declaration();
      if (declaration) {
        statements.push(declaration);
      }
    }
    return statements;
  }

  private declaration() {
    try {
      if (this.match(FUN)) return this.function();
      if (this.match(VAR)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  }

  private function() {
    const name = this.consume(IDENTIFIER, `Expect function name.`);
    this.consume(LEFT_PAREN, `Expect '(' after function name.`);
    const params: Token[] = [];
    if (!this.check(RIGHT_PAREN)) {
      do {
        if (params.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.");
        }
        params.push(this.consume(IDENTIFIER, 'Expect parameter name.'));
      } while (this.match(COMMA));
    }
    this.consume(RIGHT_PAREN, "Expect ')' after parameters.");
    this.consume(LEFT_BRACE, "Expect '{' before function body");
    const body = this.block();
    return new FunctionStmt(name, params, body);
  }

  private varDeclaration() {
    const name = this.consume(IDENTIFIER, 'Expect variable name.');

    let initializer = null;
    if (this.match(EQUAL)) {
      initializer = this.expression();
    }

    this.consume(SEMICOLON, "Expect ';' after variable declaration.");
    return new VarStmt(name, initializer);
  }

  private statement() {
    if (this.match(FOR)) return this.forStatement();
    if (this.match(IF)) return this.ifStatement();
    if (this.match(RETURN)) return this.returnStatement();
    if (this.match(WHILE)) return this.whileStatement();
    if (this.match(LEFT_BRACE)) {
      return new BlockStmt(this.block());
    }
    return this.expressionStatement();
  }

  private returnStatement() {
    const keyword = this.previous();
    let value = null;
    if (!this.check(SEMICOLON)) {
      value = this.expression();
    }
    this.consume(SEMICOLON, "Expect ';' after return value.");
    return new ReturnStmt(keyword, value);
  }

  private forStatement(): Stmt {
    this.consume(LEFT_PAREN, "Expect '(' after 'for'.");
    let initializer: Stmt | null = null;
    if (this.match(SEMICOLON)) {
      initializer = null;
    } else if (this.match(VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }
    let condition: Expr | null = null;
    if (!this.check(SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(SEMICOLON, "Expect ';' after loop condition.");
    let increment: Expr | null = null;
    if (!this.check(RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(RIGHT_PAREN, "Expect ')' after for clauses.");
    let body = this.statement();
    if (increment !== null) {
      body = new BlockStmt([body, new ExpressionStmt(increment)]);
    }
    if (condition === null) condition = new LiteralExpr(true);
    body = new WhileStmt(condition, body);
    if (initializer !== null) {
      body = new BlockStmt([initializer, body]);
    }
    return body;
  }

  private whileStatement(): Stmt {
    this.consume(LEFT_PAREN, "Expect '(' after 'while'.");
    const condition = this.expression();
    this.consume(RIGHT_PAREN, "Expect ')' after while condition.");
    const body = this.statement();
    return new WhileStmt(condition, body);
  }

  private ifStatement(): Stmt {
    this.consume(LEFT_PAREN, "Expect '(' after 'if'.");
    const condition = this.expression();
    this.consume(RIGHT_PAREN, "Expect ')' after if condition.");
    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(ELSE)) {
      elseBranch = this.statement();
    }
    return new IfStmt(condition, thenBranch, elseBranch);
  }

  private block() {
    const statements: Stmt[] = [];
    while (!this.check(RIGHT_BRACE) && !this.isAtEnd()) {
      const declaration = this.declaration();
      if (declaration) {
        statements.push(declaration);
      }
    }
    this.consume(RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  private expressionStatement() {
    const expr = this.expression();
    this.consume(SEMICOLON, "Expect ';' after expression.");
    return new ExpressionStmt(expr);
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.ternary();
    if (this.match(EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();
      if (expr instanceof VariableExpr) {
        const name = expr.name;
        return new AssignExpr(name, value);
      }
      this.error(equals, 'Invalid assignment target.');
    }
    return expr;
  }

  private ternary(): Expr {
    let expr = this.or();
    if (this.match(QUESTION)) {
      const trueBranch = this.expression();
      this.consume(COLON, 'Expect : after true branch of ternary operator.');
      const falseBranch = this.ternary();
      expr = new TernaryExpr(expr, trueBranch, falseBranch);
    }
    return expr;
  }

  private or(): Expr {
    let left = this.and();
    if (this.match(PIPE_PIPE)) {
      const operator = this.previous();
      let right = this.and();
      return new LogicalExpr(left, operator, right);
    }
    return left;
  }

  private and(): Expr {
    let left = this.equality();
    if (this.match(AMPERSAND_AMPERSAND)) {
      const operator = this.previous();
      let right = this.equality();
      return new LogicalExpr(left, operator, right);
    }
    return left;
  }

  private equality(): Expr {
    let expr = this.comparison();
    while (this.match(BANG_EQUAL, EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();

    while (this.match(GREATER, GREATER_EQUAL, LESS, LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match(PLUS, MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();

    while (this.match(STAR, SLASH)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match(MINUS, BANG)) {
      const operator = this.previous();
      const expr = this.unary();
      return new UnaryExpr(operator, expr);
    }
    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();
    const accessors = [];

    while (true) {
      if (this.match(LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(LEFT_BRACKET)) {
        if (this.peek().type === NUMBER || this.peek().type === IDENTIFIER) {
          accessors.push(this.advance());
        }
        this.consume(RIGHT_BRACKET, "Expect ']' after indexed access");
      } else {
        break;
      }
    }
    if (accessors.length !== 0) return new IndexAccessExpr(expr, accessors);
    return expr;
  }

  private finishCall(callee: Expr) {
    const args: Expr[] = [];
    if (!this.check(RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match(COMMA));
    }

    const paren = this.consume(RIGHT_PAREN, "Expect ')' after arguments.");
    return new CallExpr(callee, paren, args);
  }

  private primary(): Expr {
    if (this.match(FALSE)) return new LiteralExpr(false);
    if (this.match(TRUE)) return new LiteralExpr(true);
    if (this.match(NIL)) return new LiteralExpr(null);
    if (this.match(NUMBER, STRING))
      return new LiteralExpr(this.previous().literal ?? null);
    if (this.match(IDENTIFIER)) {
      return new VariableExpr(this.previous());
    }
    if (this.match(LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(RIGHT_PAREN, "Expect ')' after expression.");
      return new GroupingExpr(expr);
    }
    if (this.match(LEFT_BRACKET)) {
      return this.array();
    }
    if (this.match(LEFT_BRACE)) {
      return this.hash();
    }
    throw this.error(this.peek(), 'Expect expression.');
  }

  private array(): ArrayLiteralExpr {
    if (this.match(RIGHT_BRACKET)) return new ArrayLiteralExpr([]);
    const firstEl = this.primary();
    const arr = [];
    arr.push(firstEl);
    while (!this.match(RIGHT_BRACKET) && !this.isAtEnd()) {
      this.consume(COMMA, "Expect ',' after element in array literal.");
      if (this.peek().type !== RIGHT_BRACKET) {
        const newEl = this.primary();
        arr.push(newEl);
      }
    }
    if (this.isAtEnd() && this.previous().type !== RIGHT_BRACKET) {
      throw this.error(this.peek(), 'Unterminated array.');
    }
    return new ArrayLiteralExpr(arr);
  }

  private hash(): HashLiteralExpr {
    if (this.match(RIGHT_BRACE)) return new HashLiteralExpr({});
    const firstEl = this.hashMember();
    const hashes = [];
    hashes.push(firstEl);
    while (!this.match(RIGHT_BRACE) && !this.isAtEnd()) {
      this.consume(COMMA, "Expect ',' after element in hash literal.");
      if (this.peek().type !== RIGHT_BRACE) {
        const newEl = this.hashMember();
        hashes.push(newEl);
      }
    }
    if (this.isAtEnd() && this.previous().type !== RIGHT_BRACE) {
      throw this.error(this.peek(), 'Unterminated hash.');
    }
    return new HashLiteralExpr(
      hashes.reduce((acc, curr) => ({ ...acc, ...curr }), {})
    );
  }

  private hashMember() {
    const key = this.consume(
      TokenType.IDENTIFIER,
      'Expect key name in new element of map.'
    );
    this.consume(TokenType.COLON, "Expect ':' after key name in map element.");
    const value = this.primary();
    return { [key.lexeme]: value };
  }
  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == SEMICOLON) return;

      switch (this.peek().type) {
        case FUN:
        case VAR:
        case FOR:
        case IF:
        case WHILE:
        case RETURN:
          return;
      }

      this.advance();
    }
  }

  private consume(type: TokenType, message: string) {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string) {
    tokenError(token, message, this.source);
    return new ParseError();
  }

  private match(...types: TokenType[]) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd() {
    return this.peek().type === EOF;
  }

  private peek() {
    return this.tokens[this.current];
  }

  private previous() {
    return this.tokens[this.current - 1];
  }
}
