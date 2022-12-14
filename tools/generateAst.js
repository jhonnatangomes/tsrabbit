#!/usr/bin/env node
const process = require('process');
const fs = require('fs');
function main() {
  const args = process.argv.slice(2);
  if (args.length != 1) {
    console.log('Usage: generateAst.js <output directory>');
    process.exit(64);
  }
  const outputDir = args[0];
  defineAst(
    outputDir,
    'Expr',
    [
      'ArrayLiteral -> value: Expr[]',
      'Assign       -> name: Token, value: Expr, accessors?: Expr[]',
      'Binary       -> left: Expr, operator: Token, right: Expr',
      'Call         -> callee: Expr, paren: Token, args: Expr[]',
      'Grouping     -> expression: Expr',
      'HashLiteral  -> value: HashLiteral',
      'IndexAccess  -> token: Token, accessors: Expr[], accessorsTokens: Token[]',
      'Lambda       -> params: Token[], body: Stmt[], code: string',
      'Literal      -> value: Literal',
      'Logical      -> left: Expr, operator: Token, right: Expr',
      'Ternary      -> condition: Expr, trueBranch: Expr, falseBranch: Expr',
      'Unary        -> operator: Token, right: Expr',
      'Variable     -> name: Token',
    ],
    [
      "import { Stmt } from './Stmt';",
      "import Token, { Literal } from './Token';",
      '\ntype HashLiteral = Record<string, Expr>',
    ]
  );
  defineAst(
    outputDir,
    'Stmt',
    [
      'Block        -> statements: Stmt[]',
      'Expression   -> expression: Expr',
      'ForIn        -> initializerTokens: Token[], initializers: Expr[], iterable: Expr, body: Stmt',
      'Function     -> name: Token, params: Token[], body: Stmt[], code: string',
      'If           -> condition: Expr, thenBranch: Stmt, elseBranch: Stmt | null',
      'Return       -> keyword: Token, value: Expr | null',
      'While        -> condition: Expr, body: Stmt',
      'Var          -> name: Token, initializer: Expr | null',
    ],
    ["import { Expr } from './Expr';", "import Token from './Token';"]
  );
}

function defineAst(outputDir, baseName, types, importStatements) {
  const path = `${outputDir}/${baseName}.ts`;
  let fileContent = `${importStatements.join('\n')}\n\n`;
  fileContent += defineVisitor(baseName, types);
  fileContent += defineAbstractClass(baseName);
  types.forEach((type) => {
    const className = type.split('->')[0].trim();
    const fields = type.split('->')[1].trim().replace('||', '|');
    fileContent += defineType(baseName, className, fields);
  });
  fs.writeFileSync(path, fileContent);
}

function defineVisitor(baseName, types) {
  let fileContent = `export interface ${baseName}Visitor<R> {\n`;
  types.forEach((type) => {
    const typeName = type.split('->')[0].trim();
    fileContent += `  visit${typeName}${baseName}: (${baseName.toLowerCase()}: ${typeName}${baseName}) => R;\n`;
  });
  fileContent += '}\n\n';
  return fileContent;
}
function defineAbstractClass(baseName) {
  let fileContent = `export abstract class ${baseName} {\n`;
  fileContent += `  abstract accept: <R>(visitor: ${baseName}Visitor<R>) => R;\n`;
  fileContent += `  abstract toString: () => Record<string, unknown>;\n`;
  fileContent += '}\n\n';
  return fileContent;
}
function defineType(baseName, className, fieldList) {
  let fileContent = `export class ${className}${baseName} implements ${baseName} {\n`;
  const fields = fieldList.split(', ');
  fields.forEach((field) => {
    fileContent += `  ${field};\n`;
  });
  fileContent += '\n';
  fileContent += `  constructor(${fieldList}) {\n`;
  fields.forEach((field) => {
    const name = field.split(':')[0].trim().replace('?', '');
    fileContent += `    this.${name} = ${name};\n`;
  });
  fileContent += '  }\n\n';
  fileContent += `  accept<R>(visitor: ${baseName}Visitor<R>): R {\n`;
  fileContent += `    return visitor.visit${className}${baseName}(this);\n`;
  fileContent += `  }\n`;
  fileContent += `  toString() {\n`;
  fileContent += `    return {\n`;
  fields.map((field) => {
    if (className === 'ArrayLiteral') {
      fileContent += `      value: this.value.map((v) => v.toString()),\n`;
      return;
    }
    if (className === 'HashLiteral') {
      fileContent += `      value: Object.fromEntries(
        Object.entries(this.value).map(([k, v]) => [k, v.toString()])
      ),\n`;
      return;
    }
    const name = field.split(':')[0].trim();
    const type = field.split(':')[1].trim();
    fileContent += `      ${name.replace('?', '')}: this.${name}${
      type.includes('null') ? '?' : ''
    }${
      type.includes('[]')
        ? '.map(v => v.toString())'
        : type !== 'Literal'
        ? '.toString()'
        : ''
    }${name.includes('?') ? ' || null' : ''},\n`;
  });
  fileContent += `    };\n`;
  fileContent += `  }\n`;
  fileContent += '}\n\n';
  return fileContent;
}

main();
