import { Callable } from './Callable';
import { TokenType } from './TokenType';
type Position = {
  start: number;
  end: number;
};

export type Literal =
  | string
  | number
  | boolean
  | Callable
  | null
  | unknown[]
  | Record<string, unknown>;

export default class Token {
  type: TokenType;
  lexeme: string;
  literal: Literal;
  position: Position;

  constructor(
    type: TokenType,
    lexeme: string,
    position: Position,
    literal: Literal = null
  ) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.position = position;
  }

  toString() {
    return {
      type: TokenType[this.type],
      lexeme: this.lexeme,
      literal: this.literal,
    };
  }
}
