# TsRabbit

This is a typescript implementation of the tree-walk interpreter of the Lox programming language from the excellent book [Crafting Interpreters], by Robert Nystrom. I intend to add my own features to the language. This is just an exercise in learning, so I won't bother that much to make it as performant as it can be. Once I think that the language is finished, I can start working on improving it performance-wise. I really like rabbits, hence the name of the language.

[crafting interpreters]: https://craftinginterpreters.com/

## Grammar

This space will be used to specify Rabbit's grammar. It will be updated as I work on it. Without further ado, that is Rabbit's grammar so far:

```
program         → declaration* EOF ;
declaration     → varDecl
                | typeDecl 
                | statement ; 
typeDecl        → "type" IDENTIFIER "=" type ( "|" type )* ";" ;
varDecl         → type IDENTIFIER "=" expression  ";" ;
statement       → exprStatement ;
exprStatement   → expression ";" ;
expression      → ternary ;
ternary         → logic_or ( "?" ternary ":" ternary ) * ;
logic_or        → logic_and ( "||" logic_and ) * ;
logic_and       → equality ( "&&" equality ) * ;
equality        → comparison ( ( "!=" | "==" ) comparison )* ;
comparison      → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term            → factor ( ( "-" | "+" ) factor )* ;
factor          → unary ( ( "/" | "*" ) unary )* ;
unary           → ( "!" | "-" ) unary
                | primary ;
primary         → primitive
                | "(" expression ")"
                | IDENTIFIER ;
array           → "[" ( primitive ( "," primitive ) * ( "," ) * ) * "]"
map             → "{" ( mapMem ( "," mapMem ) * ( "," ) * ) * "}"
primitive       → NUMBER | STRING | true | false | null | array | map ;
mapMem          → IDENTIFIER ":" primitive ;
type            → typePrimitive ( ( "[]" ) | "[" type "]" )* ;
typePrimitive   → "number" | "string" | "map" | "bool" | "void" ;
```

## Installation

You can build the project by cloning the repo and running the build script:

```
git clone https://github.com/jhonnatangomes/tsrabbit
cd tsrabbit
yarn
yarn build
```

After the build has succeeded, a `bin` directory will be created and you can run the interpreter via `bin/index.js`. You can also run the internal install-rabbit script via `yarn install-rabbit`. This will bundle the ts code into a single executable, place it under `~/.tsrabbit/tsrabbit` and give it executable permission.

In case you don't have yarn installed, you can install it with npm:

```
npm i -g install yarn
```

You can also install the tsrabbit executable in the folder mentioned above by running the command below:

```
git clone https://github.com/jhonnatangomes/tsrabbit /tmp/tsrabbit && cd /tmp/tsrabbit && chmod +x ./tools/install.sh && ./tools/install.sh
```
