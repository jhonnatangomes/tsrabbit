import { RuntimeError } from './Error';
import Token, { Literal } from './Token';

function assertHomogeneousType(types: string[], token: Token, message: string) {
  for (let i = 1; i < types.length; i++) {
    const currType = types[i];
    const prevType = types[i - 1];
    if (currType !== prevType) {
      throw new RuntimeError(token, `${message}: ${prevType} and ${currType}`);
    }
  }
}

export function getLiteralType(value: Literal, token: Token): string {
  if (Array.isArray(value)) {
    const types = value.map((el) => getLiteralType(el, token));
    assertHomogeneousType(
      types,
      token,
      'Types of array elements are not equal'
    );
    return `${types[0]}[]`;
  }
  if (value === null) return 'void';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  const mapTypes = Object.entries(value).map(([_, v]) =>
    getLiteralType(v as Literal, token)
  );
  assertHomogeneousType(mapTypes, token, 'Types of map values are not equal');
  return `map[${mapTypes[0]}]`;
}
