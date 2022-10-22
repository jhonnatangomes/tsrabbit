import { TokenType } from './TokenType';

export type Line = {
  number: number;
  column: number;
  line: string;
};

export type Literal = string | number;

export default class Token {
  type: TokenType;
  lexeme: string;
  literal?: Literal;
  line: Line;

  constructor(type: TokenType, lexeme: string, line: Line, literal?: Literal) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
  }

  toString() {
    return {
      type: TokenType[this.type],
      lexeme: this.lexeme,
      literal: this.literal,
    };
  }
}
