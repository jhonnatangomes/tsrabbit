import { RuntimeError } from './Error';
import { getTypesFromUnion } from './helpers';
import Token, { Literal } from './Token';

export default class Environment {
  values: Record<string, { literal: Literal; type: string }> = {};
  types: Record<string, string[]> = {
    string: ['string'],
    number: ['number'],
    boolean: ['boolean'],
    void: ['void'],
  };
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
    const globalEnv = this.getGlobalEnvironment();
    if (Object.keys(globalEnv).includes(name.lexeme)) {
      throw new RuntimeError(
        name,
        `A type with the same name is already defined.`
      );
    }
    this.values[name.lexeme] = { literal: value, type };
  }

  defineType(name: Token, type: string) {
    if (this.types[name.lexeme] !== undefined) {
      throw new RuntimeError(name, `Type ${name} is already declared.`);
    }
    if (Object.keys(this.values).includes(type)) {
      throw new RuntimeError(
        name,
        `A variable with the same name is already declared`
      );
    }
    this.types[name.lexeme] = getTypesFromUnion(type);
  }

  getType(name: Token, type: string): string[] {
    const simpleTypes = Object.keys(this.types);
    if (simpleTypes.includes(type)) return this.types[type];
    const arrayRegex = new RegExp(`^(${simpleTypes.join('|')})((?:\\[\\])+)$`);
    const arrayMatch = type.match(arrayRegex);
    if (arrayMatch) {
      return this.types[arrayMatch[1]].map((t) => t + arrayMatch[2]);
    }
    const mapRegex = /^map\[(.*)\]$/;
    const mapMatch = type.match(mapRegex);
    if (mapMatch) {
      return this.getType(name, mapMatch[1]).map((t) => `map[${t}]`);
    }
    throw new RuntimeError(name, `Type ${type} is not defined`);
  }

  assertType(equalToken: Token, type: string) {
    const types = getTypesFromUnion(type);
    if (types.every(this.isValidType)) return;
    throw new RuntimeError(equalToken, `Type ${type} is not defined`);
  }

  get(name: Token): { literal: Literal; type: string } {
    if (this.values[name.lexeme] !== undefined) {
      return this.values[name.lexeme];
    }
    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }
    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  //helpers
  private getGlobalEnvironment = (): Environment => {
    if (this.enclosing !== null) return this.getGlobalEnvironment();
    return this;
  };

  private isValidType = (type: string): boolean => {
    const simpleTypes = Object.keys(this.types);
    if (simpleTypes.includes(type)) return true;
    const arrayRegex = new RegExp(`^(${simpleTypes.join('|')})(\\[\\])+$`);
    if (type.match(arrayRegex)) return true;
    const mapRegex = /^map\[(.*)\]$/;
    const mapMatch = type.match(mapRegex);
    if (mapMatch) {
      return this.isValidType(mapMatch[1]);
    }
    return false;
  };
}
