import fs from 'fs';
import process from 'process';
import readline from 'readline';
import { Line, lineObject } from './helpers';
import Interpreter from './Interpreter';
import Parser from './Parser';
import RuntimeError from './RuntimeError';
import Scanner from './Scanner';
import Token from './Token';
import { TokenType } from './TokenType';

let hadError = false;
let hadRuntimeError = false;

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    console.log('Usage: tsrabbit [script]');
    process.exit(64);
  } else if (args.length === 1) {
    runFile(args[0]);
  } else {
    runPrompt();
  }
}

function runFile(path: string) {
  const file = fs.readFileSync(path);
  run(file.toString());
  if (hadError) process.exit(65);
  if (hadRuntimeError) process.exit(70);
}

function runPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });
  console.log('Welcome to TsRabbit version 0.0.0');
  rl.prompt();
  rl.on('line', (line) => {
    run(line);
    hadError = false;
    rl.prompt();
  }).on('close', () => console.log('Thanks for using TsRabbit'));
}

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens, source);
  const expression = parser.parse();
  if (hadError) return;
  const interpreter = new Interpreter(source);
  //@ts-ignore
  interpreter.interpret(expression);
  // tokens.forEach((token) => console.log(token.toString()));
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

main();
