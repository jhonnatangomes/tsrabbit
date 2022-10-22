import { error } from '.';
import Token, { Line, Literal } from './Token';
import { TokenType } from './TokenType';

const {
  EOF,
  LEFT_BRACE,
  LEFT_PAREN,
  RIGHT_BRACE,
  RIGHT_PAREN,
  COMMA,
  DOT,
  MINUS,
  PLUS,
  SEMICOLON,
  STAR,
  BANG,
  BANG_EQUAL,
  EQUAL,
  EQUAL_EQUAL,
  LESS,
  LESS_EQUAL,
  GREATER,
  GREATER_EQUAL,
  PLUS_PLUS,
  MINUS_MINUS,
  PLUS_EQUAL,
  MINUS_EQUAL,
  STAR_EQUAL,
  SLASH_EQUAL,
  SLASH,
  STRING,
  NUMBER,
  IDENTIFIER,
  AND,
  CLASS,
  ELSE,
  FALSE,
  FOR,
  FUN,
  IF,
  NIL,
  OR,
  PRINT,
  RETURN,
  SUPER,
  THIS,
  TRUE,
  VAR,
  WHILE,
} = TokenType;

export default class Scanner {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private static keywords: Record<string, TokenType> = {
    and: AND,
    class: CLASS,
    else: ELSE,
    false: FALSE,
    for: FOR,
    fun: FUN,
    if: IF,
    nil: NIL,
    or: OR,
    print: PRINT,
    return: RETURN,
    super: SUPER,
    this: THIS,
    true: TRUE,
    var: VAR,
    while: WHILE,
  };

  constructor(source: string) {
    this.source = source;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(EOF, '', this.lineObject(), null));
    return this.tokens;
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case '(':
        this.addToken(LEFT_PAREN);
        break;
      case ')':
        this.addToken(RIGHT_PAREN);
        break;
      case '{':
        this.addToken(LEFT_BRACE);
        break;
      case '}':
        this.addToken(RIGHT_BRACE);
        break;
      case ',':
        this.addToken(COMMA);
        break;
      case '.':
        this.addToken(DOT);
        break;
      case '-':
        this.addToken(
          this.match('-') ? MINUS_MINUS : this.match('=') ? MINUS_EQUAL : MINUS
        );
        break;
      case '+':
        this.addToken(
          this.match('+') ? PLUS_PLUS : this.match('=') ? PLUS_EQUAL : PLUS
        );
        break;
      case ';':
        this.addToken(SEMICOLON);
        break;
      case '*':
        this.addToken(this.match('=') ? STAR_EQUAL : STAR);
        break;
      case '!':
        this.addToken(this.match('=') ? BANG_EQUAL : BANG);
        break;
      case '=':
        this.addToken(this.match('=') ? EQUAL_EQUAL : EQUAL);
        break;
      case '<':
        this.addToken(this.match('=') ? LESS_EQUAL : LESS);
        break;
      case '>':
        this.addToken(this.match('=') ? GREATER_EQUAL : GREATER);
        break;
      case '/':
        if (this.match('/')) {
          while (!this.match('\n') && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(this.match('=') ? SLASH_EQUAL : SLASH);
        }
        break;
      case ' ':
      case '\r':
      case '\t':
      case '\n':
        break;
      case '"':
        this.string();
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          error(this.lineObject(), `Unexpected character: ${c}`);
        }
        break;
    }
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.substring(this.start, this.current);
    let type = Scanner.keywords[text];
    if (!type) {
      type = IDENTIFIER;
    }
    this.addToken(type);
  }

  private isAlpha(c: string) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
  }

  private isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private number() {
    while (this.isDigit(this.peek())) this.advance();

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      //Consume the .
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(
      NUMBER,
      parseFloat(this.source.substring(this.start, this.current))
    );
  }

  private peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  private isDigit(c: string) {
    return c >= '0' && c <= '9';
  }

  private string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      this.advance();
    }

    if (this.isAtEnd()) {
      return error(this.lineObject(), 'Unterminated string.');
    }

    // The closing ".
    this.advance();

    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(STRING, value);
  }

  private peek() {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  private match(expected: string) {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    return true;
  }

  private advance() {
    return this.source.charAt(this.current++);
  }

  private addToken(type: TokenType, literal?: Literal) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, this.lineObject(), literal));
  }

  private lineObject(): Line {
    const lines = this.source.slice(0, this.start + 1).split('\n');
    const lineNumber = lines.length;
    const visibleChars = lines
      .slice(0, -1)
      .reduce((prev, curr) => prev + curr.length + 1, 0);
    const column = this.start + 1 - visibleChars;
    return {
      number: lineNumber,
      line: this.source.split('\n').at(lineNumber - 1) || '',
      column,
    };
  }

  private isAtEnd() {
    return this.current >= this.source.length;
  }
}
