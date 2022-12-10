import { lineError } from './Error';
import { lineObject } from './helpers';
import Token, { Literal } from './Token';
import { TokenType } from './TokenType';

const {
  EOF,
  LEFT_BRACE,
  LEFT_PAREN,
  RIGHT_BRACE,
  RIGHT_PAREN,
  COMMA,
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
  SLASH,
  STRING,
  NUMBER,
  IDENTIFIER,
  AND,
  ELSE,
  FALSE,
  FOR,
  FUN,
  IF,
  NIL,
  OR,
  RETURN,
  TRUE,
  VAR,
  WHILE,
  QUESTION,
  COLON,
  AMPERSAND_AMPERSAND,
  PIPE_PIPE,
  LEFT_BRACKET,
  RIGHT_BRACKET,
  PIPE,
  IN,
  ARROW,
} = TokenType;

export default class Scanner {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private static keywords: Record<string, TokenType> = {
    and: AND,
    else: ELSE,
    false: FALSE,
    for: FOR,
    fun: FUN,
    if: IF,
    in: IN,
    nil: NIL,
    or: OR,
    return: RETURN,
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

    this.tokens.push(
      new Token(EOF, '', { start: this.start, end: this.current }, null)
    );
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
      case '[':
        this.addToken(LEFT_BRACKET);
        break;
      case ']':
        this.addToken(RIGHT_BRACKET);
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
      case '-':
        this.addToken(MINUS);
        break;
      case '+':
        this.addToken(PLUS);
        break;
      case ';':
        this.addToken(SEMICOLON);
        break;
      case '*':
        this.addToken(STAR);
        break;
      case '!':
        this.addToken(this.match('=') ? BANG_EQUAL : BANG);
        break;
      case '=':
        this.addToken(
          this.match('=') ? EQUAL_EQUAL : this.match('>') ? ARROW : EQUAL
        );
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
          this.addToken(SLASH);
        }
        break;
      case '?':
        this.addToken(QUESTION);
        break;
      case ':':
        this.addToken(COLON);
        break;
      case '&':
        if (this.match('&')) {
          this.addToken(AMPERSAND_AMPERSAND);
        } else {
          lineError(lineObject(this.source, this.start), `Expected another &.`);
        }
        break;
      case '|':
        this.addToken(this.match('|') ? PIPE_PIPE : PIPE);
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
          lineError(
            lineObject(this.source, this.start),
            `Unexpected character: ${c}`
          );
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
      return lineError(
        lineObject(this.source, this.start),
        'Unterminated string.'
      );
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
    this.tokens.push(
      new Token(type, text, { start: this.start, end: this.current }, literal)
    );
  }

  private isAtEnd() {
    return this.current >= this.source.length;
  }
}
