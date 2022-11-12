import { lineError, lineObject } from './Error';
import Token, { Literal } from './Token';
import { TokenType } from './TokenType';

export default class Scanner {
  private tokens: Token[] = [];
  private source: string;
  private start = 0;
  private current = 0;
  private keywords: Record<string, TokenType> = {
    boolean: TokenType.BOOLEAN,
    class: TokenType.CLASS,
    else: TokenType.ELSE,
    extends: TokenType.EXTENDS,
    false: TokenType.FALSE,
    for: TokenType.FOR,
    if: TokenType.IF,
    map: TokenType.MAP,
    null: TokenType.NULL,
    number: TokenType.NUMBER,
    return: TokenType.RETURN,
    string: TokenType.STRING,
    super: TokenType.SUPER,
    this: TokenType.THIS,
    true: TokenType.TRUE,
    type: TokenType.TYPE,
    void: TokenType.VOID,
    while: TokenType.WHILE,
  };

  constructor(source: string) {
    this.source = source;
  }

  scanTokens = () => {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push(
      new Token(TokenType.EOF, '', {
        start: this.current,
        end: this.current,
      })
    );
    return this.tokens;
  };

  private isAtEnd = () => {
    return this.current >= this.source.length;
  };

  private scanToken = () => {
    const c = this.advance();
    switch (c) {
      case '(':
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case '[':
        this.addToken(TokenType.LEFT_BRACKET);
        break;
      case ']':
        this.addToken(TokenType.RIGHT_BRACKET);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case '.':
        this.addToken(TokenType.DOT);
        break;
      case '?':
        this.addToken(TokenType.QUESTION);
        break;
      case ':':
        this.addToken(TokenType.COLON);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON);
        break;
      case '+':
        this.addToken(
          this.match('+')
            ? TokenType.PLUS_PLUS
            : this.match('=')
            ? TokenType.PLUS_EQUAL
            : TokenType.PLUS
        );
        break;
      case '-':
        this.addToken(
          this.match('-')
            ? TokenType.MINUS_MINUS
            : this.match('=')
            ? TokenType.MINUS_EQUAL
            : TokenType.MINUS
        );
        break;
      case '*':
        this.addToken(this.match('=') ? TokenType.STAR_EQUAL : TokenType.STAR);
        break;
      case '/':
        if (this.match('/')) {
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(
            this.match('=') ? TokenType.SLASH_EQUAL : TokenType.SLASH
          );
        }
        break;
      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case '=':
        this.addToken(
          this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case '>':
        this.addToken(
          this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '|':
        this.addToken(this.match('|') ? TokenType.OR : TokenType.TYPE_OR);
        break;
      case '&':
        if (this.match('&')) {
          this.addToken(TokenType.AND);
        } else {
          lineError(
            lineObject(this.source, this.start),
            `Unexpected character: ${c}`
          );
        }
        break;
      case ' ':
      case '\r':
      case '\t':
      case '\n':
        break;
      case `"`:
        this.string(`"`);
        break;
      case `'`:
        this.string(`'`);
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          lineError(
            lineObject(this.source, this.start),
            `Unexpected character: ${c}`
          );
        }
    }
  };

  //helpers
  private advance = () => {
    return this.source.charAt(this.current++);
  };

  private addToken = (type: TokenType, literal: Literal = null) => {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push(
      new Token(
        type,
        lexeme,
        {
          start: this.start,
          end: this.current,
        },
        literal
      )
    );
  };

  private isAlpha = (c: string) => {
    return /^[_A-Za-z]$/.test(c);
  };

  private isAlphaNumeric = (c: string) => {
    return this.isAlpha(c) || this.isDigit(c);
  };

  private isDigit = (c: string) => {
    return /^[0-9]$/.test(c);
  };

  private match = (expected: string) => {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;
    this.current++;
    return true;
  };

  private peek = () => {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  };

  private peekNext = () => {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  };

  //literals
  private identifier = () => {
    while (this.isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.substring(this.start, this.current);
    let type = this.keywords[text];
    if (!type) {
      type = TokenType.IDENTIFIER;
    }
    this.addToken(type);
  };

  private number = () => {
    while (this.isDigit(this.peek())) this.advance();

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(
      TokenType.NUMBER_LITERAL,
      Number(this.source.substring(this.start, this.current))
    );
  };

  private string = (delimiter: string) => {
    while (this.peek() !== delimiter && !this.isAtEnd()) {
      this.advance();
    }
    if (this.isAtEnd()) {
      return lineError(
        lineObject(this.source, this.start),
        'Unterminated string.'
      );
    }
    // The closing " or '.
    this.advance();

    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING_LITERAL, value);
  };
}
