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
  defineAst(outputDir, 'Expr', [
    'Binary   | left: Expr<R>, operator: Token, right: Expr<R>',
    'Grouping | expression: Expr<R>',
    'Literal  | value: Literal',
    'Unary    | operator: Token, right: Expr<R>',
  ]);
}

function defineAst(outputDir, baseName, types) {
  const path = `${outputDir}/${baseName}.ts`;
  let fileContent = "import Token, { Literal } from './Token';\n\n";
  fileContent += defineVisitor(baseName, types);
  fileContent += defineAbstractClass(baseName);
  types.forEach((type) => {
    const className = type.split('|')[0].trim();
    const fields = type.split('|')[1].trim();
    fileContent += defineType(baseName, className, fields);
  });
  fs.writeFileSync(path, fileContent);
}

function defineVisitor(baseName, types) {
  let fileContent = `export interface Visitor<R> {\n`;
  types.forEach((type) => {
    const typeName = type.split('|')[0].trim();
    fileContent += `  visit${typeName}${baseName}: (${baseName.toLowerCase()}: ${typeName}${baseName}<R>) => R;\n`;
  });
  fileContent += '}\n\n';
  return fileContent;
}

function defineAbstractClass(baseName) {
  let fileContent = `abstract class ${baseName}<R> {\n`;
  fileContent += `  abstract accept: (visitor: Visitor<R>) => R;\n`;
  fileContent += '}\n\n';
  return fileContent;
}

function defineType(baseName, className, fieldList) {
  let fileContent = `export class ${className}${baseName}<R> implements ${baseName}<R> {\n`;
  const fields = fieldList.split(', ');
  fields.forEach((field) => {
    fileContent += `  ${field};\n`;
  });
  fileContent += '\n';
  fileContent += `  constructor(${fieldList}) {\n`;
  fields.forEach((field) => {
    const name = field.split(':')[0].trim();
    fileContent += `    this.${name} = ${name};\n`;
  });
  fileContent += '  }\n\n';
  fileContent += `  accept(visitor: Visitor<R>): R {\n`;
  fileContent += `    return visitor.visit${className}${baseName}(this);\n`;
  fileContent += `  }\n`;
  fileContent += '}\n\n';
  return fileContent;
}

main();
