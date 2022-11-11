import { Literal } from './Token';

type NonArrayType = 'number' | 'string' | 'void' | 'boolean' | 'map';
type ArrayType = `${NonArrayType}[]`;
function getNonArrayType(value: Literal) {
  if (value === null) return 'void';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'map';
}
export function getLiteralType(value: Literal): ArrayType | NonArrayType {
  if (Array.isArray(value)) {
    const arrayType = getNonArrayType(value[0]);
    return `${arrayType}[]`;
  }
  return getNonArrayType(value);
}
