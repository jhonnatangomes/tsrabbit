import { ParseError, tokenError } from './Error';
import {
  BinaryExpr,
  Expr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  TernaryExpr,
  UnaryExpr,
  VariableExpr,
} from './Expr';
import { typeKeywords } from './helpers';
import { ExpressionStmt, IfStmt, Stmt, TypeStmt, VarStmt } from './Stmt';
import Token from './Token';
import { TokenType } from './TokenType';

export default class Parser {
  private tokens: Token[];
  private source: string;
  private current = 0;
  constructor(tokens: Token[], source: string) {
    this.tokens = tokens;
    this.source = source;
  }

  parse = () => {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      const declaration = this.declaration();
      if (declaration) {
        statements.push(declaration);
      }
    }
    return statements;
  };

  //productions
  private declaration = (): Stmt | null => {
    try {
      if (this.match(TokenType.TYPE)) return this.typeDeclaration();
      if (
        (this.peek().type === TokenType.IDENTIFIER ||
          typeKeywords().includes(this.peek().type)) &&
        (this.peekNext().type === TokenType.IDENTIFIER ||
          this.peekNext().type === TokenType.LEFT_BRACKET)
      ) {
        return this.varDeclaration();
      }
      return this.statement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  };

  private typeDeclaration = (): Stmt => {
    const identifier = this.consume(
      TokenType.IDENTIFIER,
      'Expect identifier in type declaration.'
    );
    this.consume(
      TokenType.EQUAL,
      "Expect '=' after identifier in type declaration."
    );
    let type = this.type();
    while (this.match(TokenType.TYPE_OR)) {
      type += ` | ${this.type()}`;
    }
    this.consume(TokenType.SEMICOLON, "Expect ';' after type declaration.");
    return new TypeStmt(identifier, type);
  };

  private varDeclaration = (): Stmt => {
    const type = this.type();
    const name = this.consume(
      TokenType.IDENTIFIER,
      'Expect identifier in variable declaration'
    );
    const equal = this.consume(
      TokenType.EQUAL,
      "Expect '=' after identifier in variable declaration"
    );
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration");
    return new VarStmt(type, name, expr, equal);
  };

  private type = (): string => {
    const typePrimitiveToken = this.advance();
    let { lexeme: typePrimitive } = typePrimitiveToken;
    while (this.match(TokenType.LEFT_BRACKET)) {
      if (this.peek().type !== TokenType.RIGHT_BRACKET) {
        const mapType = this.type();
        this.consume(
          TokenType.RIGHT_BRACKET,
          "Expect ']' after opening '[' in map type declaration"
        );
        typePrimitive += `[${mapType}]`;
        break;
      }
      this.consume(
        TokenType.RIGHT_BRACKET,
        "Expect ']' after opening '[' in array type declaration"
      );
      typePrimitive += '[]';
    }
    return typePrimitive;
  };

  private statement = (): Stmt => {
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }
    return this.expressionStatement();
  };

  private ifStatement = (): Stmt => {
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if' keyword.");
    const ifCondition = this.expression();
    this.consume(
      TokenType.RIGHT_PAREN,
      "Expect ')' after condition in if statement keyword."
    );
    const thenBranch = this.statement();
    const elseIfConditions: Expr[] = [];
    const alternativeBranches: Stmt[] = [];
    while (this.match(TokenType.ELSE)) {
      if (this.match(TokenType.IF)) {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after else if keyword.");
        elseIfConditions.push(this.expression());
        this.consume(
          TokenType.RIGHT_PAREN,
          "Expect ')' after else if condition."
        );
      }
      alternativeBranches.push(this.statement());
    }
    return new IfStmt(
      ifCondition,
      elseIfConditions,
      thenBranch,
      alternativeBranches
    );
  };

  private expressionStatement = (): Stmt => {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new ExpressionStmt(expr);
  };

  private expression = (): Expr => {
    return this.ternary();
  };

  private ternary = (): Expr => {
    const condition = this.or();
    if (this.match(TokenType.QUESTION)) {
      const trueBranch = this.ternary();
      this.consume(
        TokenType.COLON,
        "Expect ':' after true branch of ternary expression."
      );
      const falseBranch = this.ternary();
      return new TernaryExpr(condition, trueBranch, falseBranch);
    }
    return condition;
  };

  private or = (): Expr => {
    const left = this.and();
    if (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      return new LogicalExpr(left, operator, right);
    }
    return left;
  };

  private and = (): Expr => {
    const left = this.equality();
    if (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      return new LogicalExpr(left, operator, right);
    }
    return left;
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
    if (this.match(TokenType.LEFT_PAREN)) {
      const expression = this.expression();
      this.consume(
        TokenType.RIGHT_PAREN,
        "Expect ')' closing group expression."
      );
      return new GroupingExpr(expression);
    }
    if (this.match(TokenType.IDENTIFIER)) {
      return new VariableExpr(this.previous());
    }
    return this.primitive();
  };

  private primitive = (): LiteralExpr => {
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
    if (this.match(TokenType.LEFT_BRACKET)) return this.array();
    if (this.match(TokenType.LEFT_BRACE)) return this.map();
    throw this.error(this.peek(), 'Expect expression.');
  };

  private array = (): LiteralExpr => {
    if (this.match(TokenType.RIGHT_BRACKET)) return new LiteralExpr([]);
    const firstEl = this.primitive();
    const arr = [];
    arr.push(firstEl);
    while (!this.match(TokenType.RIGHT_BRACKET) && !this.isAtEnd()) {
      this.consume(
        TokenType.COMMA,
        "Expect ',' after element in array literal."
      );
      if (this.peek().type !== TokenType.RIGHT_BRACKET) {
        const newEl = this.primitive();
        arr.push(newEl);
      }
    }
    if (this.isAtEnd()) {
      throw this.error(this.peek(), 'Unterminated array.');
    }
    return new LiteralExpr(arr.map((el) => el.value));
  };

  private map = (): LiteralExpr => {
    if (this.match(TokenType.RIGHT_BRACE)) return new LiteralExpr({});
    const firstEl = this.mapMember();
    const maps = [];
    maps.push(firstEl.value);
    while (!this.match(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      this.consume(
        TokenType.COMMA,
        "Expect ',' after element in array literal."
      );
      if (this.peek().type !== TokenType.RIGHT_BRACE) {
        const newEl = this.mapMember();
        maps.push(newEl.value);
      }
    }
    if (this.isAtEnd()) {
      throw this.error(this.peek(), 'Unterminated map.');
    }
    return new LiteralExpr(
      (maps as Record<string, unknown>[]).reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {}
      )
    );
  };

  private mapMember = (): LiteralExpr => {
    const key = this.consume(
      TokenType.IDENTIFIER,
      'Expect key name in new element of map.'
    );
    this.consume(TokenType.COLON, "Expect ':' after key name in map element.");
    const { value } = this.primitive();
    return new LiteralExpr({ [key.lexeme]: value });
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
    return this.peek().type >= TokenType.EOF;
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

  private peekNext = () => {
    if (this.current + 1 >= this.tokens.length) return this.tokens.at(-1)!;
    return this.tokens[this.current + 1];
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
