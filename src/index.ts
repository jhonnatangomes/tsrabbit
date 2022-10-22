import fs from 'fs';
import process from 'process';
import readline from 'readline';
import Scanner from './Scanner';
import { Line } from './Token';

let hadError = false;

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
  tokens.forEach((token) => console.log(token.toString()));
}

export function error(line: Line, message: string) {
  report(line, '', message);
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
