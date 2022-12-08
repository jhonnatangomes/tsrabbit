import fs from 'fs';
import process, { stdin, stdout } from 'process';
import { createInterface } from 'readline';
import Environment from './Environment';
import { hadError, hadRuntimeError, resetError } from './Error';
import { logNode } from './helpers';
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
  const environment = new Environment();
  console.log('Welcome to TsRabbit');
  rl.prompt();
  rl.on('line', (line) => {
    run(line, flags, true, environment);
    resetError();
    rl.prompt();
  }).on('close', () => console.log('Thanks for using TsRabbit'));
}

function run(
  source: string,
  flags: Flag[],
  isRepl = false,
  environment?: Environment
) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();
  if (flags.includes('--print-tokens')) {
    logNode(tokens);
  }
  const parser = new Parser(tokens, source);
  const statements = parser.parse();
  if (!statements) return;
  if (flags.includes('--print-ast')) {
    logNode(statements);
  }
  if (hadError) return;
  const interpreter = new Interpreter(source, environment || new Environment());
  const result = interpreter.interpret(statements);
  if (hadRuntimeError && !isRepl) return;
  if (isRepl) {
    console.log(result ? result[0] ?? 'nil' : 'nil');
  }
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
