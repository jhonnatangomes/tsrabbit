import fs from 'fs';
import process, { stdin, stdout } from 'process';
import { createInterface } from 'readline';
import { inspect } from 'util';
import { hadError, hadRuntimeError, resetError } from './Error';
import Interpreter from './Interpreter';
import Parser from './Parser';
import Scanner from './Scanner';

type Flag = typeof VALID_FLAGS[number];
const VALID_FLAGS = ['--print-tokens', '--print-ast'];

function main() {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const flags = process.argv.slice(2).filter((arg) => arg.startsWith('--'));
  if (args.length > 1) {
    printUsageMessage();
    process.exit(64);
  } else if (args.length === 1) {
    runFile(args[0], validFlags(flags));
  } else {
    runRepl(validFlags(flags));
  }
}

function validFlags(flags: string[]): Flag[] {
  const invalidFlags = flags.filter((f) => !VALID_FLAGS.includes(f));
  if (invalidFlags.length !== 0) {
    for (const invalidFlag of invalidFlags) {
      console.log(`Invalid flag: ${invalidFlag}`);
    }
    process.exit(65);
  }
  return flags.filter((f) => VALID_FLAGS.includes(f));
}

function runFile(file: string, flags: Flag[]) {
  const source = fs.readFileSync(file).toString();
  run(source, flags);
  if (hadError) process.exit(65);
  if (hadRuntimeError) process.exit(70);
}

function runRepl(flags: Flag[]) {
  const rl = createInterface({ input: stdin, output: stdout, prompt: '>> ' });
  console.log('Welcome to TsRabbit');
  rl.prompt();
  rl.on('line', (line) => {
    run(line, flags);
    resetError();
    rl.prompt();
  }).on('close', () => console.log('Thanks for using TsRabbit'));
}

function run(source: string, flags: Flag[]) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens, source);
  const ast = parser.parse();
  if (hadError || !ast) return;
  const interpreter = new Interpreter(source);
  const result = interpreter.interpret(ast);
  if (flags.includes('--print-tokens')) {
    return tokens.forEach((token) =>
      console.log(inspect(token.toString(), { depth: null }))
    );
  }
  if (flags.includes('--print-ast')) {
    return console.log(inspect(ast.toString(), { depth: null }));
  }
  console.log(result);
}

function printUsageMessage() {
  console.log(`Usage: 
  tsrabbit - open interactive console
  tsrabbit script - interpret the given script

  Flags:
  flags need to be passed before the optional script

  --print-tokens - print the tokens produced by the scanner
  `);
}

main();
