import { RuntimeError } from './Error';
import Token, { Literal } from './Token';

export default class Environment {
  values: Record<string, { literal: Literal; type: string }> = {};
  enclosing: Environment | null;

  constructor(environment?: Environment) {
    this.enclosing = environment || null;
  }

  define(name: Token, value: Literal, type: string) {
    if (this.values[name.lexeme] !== undefined) {
      throw new RuntimeError(
        name,
        `Variable ${name.lexeme} is already declared. You might have attempted to reassign it.`
      );
    }
    this.values[name.lexeme] = { literal: value, type };
  }

  get(name: Token): Literal {
    if (this.values[name.lexeme] !== undefined) {
      return this.values[name.lexeme];
    }
    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}
