import RuntimeError from './RuntimeError';
import Token, { Literal } from './Token';

export default class Environment {
  values: Record<string, Literal> = {};
  enclosing: Environment | null;

  constructor(environment?: Environment) {
    this.enclosing = environment || null;
  }

  define(name: Token | string, value: Literal) {
    if (typeof name !== 'string' && this.values[name.lexeme] !== undefined) {
      throw new RuntimeError(name, `Cannot redeclare variable ${name.lexeme}.`);
    }
    if (typeof name === 'string') {
      this.values[name] = value;
    } else {
      this.values[name.lexeme] = value;
    }
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

  assign(name: Token, value: Literal) {
    if (this.values[name.lexeme] !== undefined) {
      this.values[name.lexeme] = value;
      return;
    }
    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }
}
