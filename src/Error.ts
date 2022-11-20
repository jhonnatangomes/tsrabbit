import { Line, lineObject } from './helpers';
import RuntimeError from './RuntimeError';
import Token from './Token';
import { TokenType } from './TokenType';

export class ParseError extends Error {}
export let hadError = false;
export let hadRuntimeError = false;

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

export function runtimeError(error: RuntimeError, source: string) {
  const line = lineObject(source, error.token.position.start);
  report(line, ` at ${error.token.lexeme}`, error.message);
  hadRuntimeError = true;
}

function report(line: Line, where: string, message: string) {
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
