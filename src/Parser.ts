import { tokenError } from '.';
import { ParseError } from './Error';
import { BinaryExpr, Expr, GroupingExpr, LiteralExpr, UnaryExpr } from './Expr';
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
  PLUS_PLUS,
  MINUS_MINUS,
  BANG,
  MINUS,
  PLUS,
  SLASH,
  STAR,
  LESS_EQUAL,
  GREATER,
  GREATER_EQUAL,
  SEMICOLON,
  CLASS,
  FUN,
  VAR,
  FOR,
  IF,
  WHILE,
  RETURN,
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
    try {
      return this.expression();
    } catch (error) {
      return null;
    }
  }

  private expression(): Expr {
    return this.equality();
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
    if (this.match(MINUS, BANG, PLUS_PLUS, MINUS_MINUS)) {
      const operator = this.previous();
      const expr = this.unary();
      return new UnaryExpr(operator, expr);
    }
    return this.primary();
  }

  private primary(): Expr {
    if (this.match(FALSE)) return new LiteralExpr(false);
    if (this.match(TRUE)) return new LiteralExpr(true);
    if (this.match(NIL)) return new LiteralExpr(null);
    if (this.match(NUMBER, STRING))
      return new LiteralExpr(this.previous().literal ?? null);
    if (this.match(LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(RIGHT_PAREN, "Expect ')' after expression.");
      return new GroupingExpr(expr);
    }
    throw this.error(this.peek(), 'Expect expression.');
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == SEMICOLON) return;

      switch (this.peek().type) {
        case CLASS:
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
