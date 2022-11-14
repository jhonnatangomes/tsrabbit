import Token from './Token';
import { TokenType } from './TokenType';

export type Line = {
  number: number;
  column: number;
  line: string;
};

export class ParseError extends Error {}

export class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

export let hadError = false;
export let hadRuntimeError = false;

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
export function lineError(line: Line, message: string) {
  report(line, '', message);
}
export function tokenError(token: Token, message: string, source: string) {
  const line = lineObject(source, token.position.start);
  if (token.type === TokenType.EOF) {
    report(line, ' at end', message);
  } else {
    report(line, ` at '${token.lexeme}'`, message);
  }
}
export function report(line: Line, where: string, message: string) {
  const { number, column, line: lineString } = line;
  console.log(`[line ${number}:${column}] Error${where}: ${message}`);
  console.log(`  ${number} | ${lineString}`);
  console.log(
    new Array(lineString.length)
      .fill('')
      .map((_, i) => (i === column - 1 ? '^' : ' '))
      .join('')
      .padStart(lineString.length + 5 + number.toString().length)
  );
  hadError = true;
}
export function resetError() {
  hadError = false;
}
export function runtimeError(error: RuntimeError, source: string) {
  // console.log({ error });
  const line = lineObject(source, error.token.position.start);
  report(line, ` at ${error.token.lexeme}`, error.message);
  hadRuntimeError = true;
}
