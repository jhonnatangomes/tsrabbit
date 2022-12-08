import { Literal } from './Token';

export type Line = {
  number: number;
  column: number;
  line: string;
};

export function lineObject(source: string, start: number): Line {
  const lines = source.slice(0, start + 1).split('\n');
  const lineNumber = lines.length;
  const visibleChars = lines
    .slice(0, -1)
    .reduce((prev, curr) => prev + curr.length + 1, 0);
  const column = start + 1 - visibleChars;
  return {
    number: lineNumber,
    line: source.split('\n').at(lineNumber - 1) || '',
    column,
  };
}

export function isObject(x: unknown): x is Record<string, Literal> {
  return x !== 'null' && typeof x === 'object' && !Array.isArray(x);
}
