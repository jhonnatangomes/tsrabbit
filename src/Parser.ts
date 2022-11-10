import { ParseError, tokenError } from './Error';
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  TernaryExpr,
  UnaryExpr,
} from './Expr';
import Token from './Token';
import { TokenType } from './TokenType';

export default class Parser {
  private tokens: Token[];
  private source: string;
  private start = 0;
  private current = 0;
  constructor(tokens: Token[], source: string) {
    this.tokens = tokens;
    this.source = source;
  }

  parse = () => {
    try {
      return this.expression();
    } catch (error) {
      return null;
    }
  };

  //productions
  private expression = (): Expr => {
    return this.ternary();
  };

  private ternary = (): Expr => {
    const condition = this.equality();
    if (this.match(TokenType.QUESTION)) {
      const trueBranch = this.equality();
      this.consume(
        TokenType.COLON,
        "Expect ':' after true branch of ternary expression."
      );
      const falseBranch = this.ternary();
      return new TernaryExpr(condition, trueBranch, falseBranch);
    }
    return condition;
  };

  private equality = (): Expr => {
    const left = this.comparison();
    if (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      return new BinaryExpr(left, operator, right);
    }
    return left;
  };

  private comparison = (): Expr => {
    const left = this.term();
    if (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      return new BinaryExpr(left, operator, right);
    }
    return left;
  };

  private term = (): Expr => {
    const left = this.factor();
    if (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      return new BinaryExpr(left, operator, right);
    }
    return left;
  };

  private factor = (): Expr => {
    const left = this.unary();
    if (this.match(TokenType.STAR, TokenType.SLASH)) {
      const operator = this.previous();
      const right = this.unary();
      return new BinaryExpr(left, operator, right);
    }
    return left;
  };

  private unary = (): Expr => {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpr(operator, right);
    }
    return this.primary();
  };

  private primary = (): Expr => {
    if (this.match(TokenType.NUMBER_LITERAL, TokenType.STRING_LITERAL)) {
      return new LiteralExpr(this.previous().literal);
    }
    if (this.match(TokenType.TRUE)) {
      return new LiteralExpr(true);
    }
    if (this.match(TokenType.FALSE)) {
      return new LiteralExpr(false);
    }
    if (this.match(TokenType.NULL)) {
      return new LiteralExpr(null);
    }
    if (this.match(TokenType.LEFT_PAREN)) {
      const expression = this.expression();
      this.consume(
        TokenType.RIGHT_PAREN,
        "Expect ')' closing group expression."
      );
      return new GroupingExpr(expression);
    }
    throw this.error(this.peek(), 'Expect expression.');
  };

  //helpers
  private advance = () => {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  };

  private check = (type: TokenType) => {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  };

  private consume = (type: TokenType, message: string) => {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  };

  private isAtEnd = () => {
    return this.current >= this.tokens.length;
  };

  private error = (token: Token, message: string) => {
    tokenError(token, message, this.source);
    return new ParseError();
  };

  private match = (...types: TokenType[]) => {
    if (this.isAtEnd()) return false;
    if (!types.includes(this.peek().type)) return false;
    this.current++;
    return true;
  };

  private peek = () => {
    return this.tokens[this.current];
  };

  private previous = () => {
    return this.tokens[this.current - 1];
  };

  //error handling
  private synchronize = () => {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.MAP:
        case TokenType.NUMBER:
        case TokenType.RETURN:
        case TokenType.STRING:
        case TokenType.WHILE:
          return;
      }

      this.advance();
    }
  };
}
