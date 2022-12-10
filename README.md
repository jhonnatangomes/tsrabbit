# TsRabbit

This is a typescript implementation of the tree-walk interpreter of the Lox programming language from the excellent book [Crafting Interpreters], by Robert Nystrom. This is just an exercise in learning, so I won't bother that much to make it as performant as it can be. I really like rabbits, hence the name of the language. As specified in the grammar I left out some parts of the language such as classes. A resolver was also not implemented. The reason for these two features being left out is because I just wanted to make a minimal implementation of the language.

[crafting interpreters]: https://craftinginterpreters.com/

## Features

The language only has numeric types, strings, booleans and the nil value. Variables can be declared with the var keyword:

```
var myVar = 5;
```

All statements in the language must end with an obligatory `;`. Function declaration is done via the fun keyword:

```
fun myFunction() {
    return "Hello World";
}
```

The rest of the features are very similar to popular programming languages, like conditional branches, loops, and so on. For a complete description of the language, please refer to the grammar below.

The standard library comes with three functions, `print`, `clock` and `random`. The `print` function just prints the arguments passed to it as expected. The `clock` function starts a clock the first time it is called and then stops a clock and returns the elapsed time the second time it is called. The `random` function accepts two numeric parameters and returns an integer number in the specified interval.

The interpreter can be started in REPL mode by just running the executable with `tsrabbit` or it can interpret a file given to it as argument. It also suports being open with two flags, namely `--print-tokens` and `--print-ast` to print the tokens and the ast respectively.

## Grammar

This space will be used to specify Rabbit's grammar. It will be updated as I work on it. Without further ado, that is Rabbit's grammar so far:

```
program        -> declaration* EOF ;
declaration    -> funDecl | varDecl | statement;
funDecl        -> "fun" function ;
function       -> IDENTIFIER "(" parameters? ")" block ;
parameters     -> IDENTIFIER ( "," IDENTIFIER )* ;
varDecl        -> "var" IDENTIFIER ("=" expression )? ";" ;
statement      -> exprStmt
               | ifStmt
               | forStmt
               | returnStmt
               | whileStmt
               | block ;
returnStmt     -> "return" expression? ";" ;
forStmt        -> longFor | rangeFor ;
rangeFor       -> "for" IDENTIFIER ("," IDENTIFIER) * "in"
               expression statement;
longFor        -> "for" "(" ( varDecl | exprStmt | ; )
                expression? ";"
                expression? ")" statement ;
whileStmt      -> "while" "(" expression ")" statement ;
ifStmt         -> "if" "(" expression ")" statement
                ("else" statement )? ;
block          -> "{" declaration* "}" ;
exprStmt       -> expression ";" ;
expression     -> assignment;
assignment     -> IDENTIFIER "=" assignment
               | ternary;
ternary        -> logic_or (? expression : expression)* ;
logic_or       -> logic_and ( "||" logic_and )* ;
logic_and      -> equality ( "&&" equality )* ;
equality       -> comparison ( ( "!=" | "==" ) comparison )* ;
comparison     -> term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term           -> factor ( ( "-" | "+" ) factor )* ;
factor         -> unary ( ( "/" | "*" ) unary )* ;
unary          -> ( "-" | "!" ) unary
               | call ;
functionCall   -> primary ( "(" arguments? ")" ) * ("|" functionCall) * ;
indexedAccess  -> primary ( "[" expression "]" ) *
call           -> functionCall | indexedAccess ;
arguments      -> expression ( "," expression ) *;
binary         -> expression operator expression ;
operator       -> "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/";
primary        -> NUMBER | STRING | "true" | "false" | "nil" | array | hash | lambda
               | "(" expression ")"
               | IDENTIFIER;
lambda         -> "|" parameters? "|" "=>" ( block | expression );
array          -> "[" expression ( "," primary  )* ( "," )* "]"
hash           -> "{" IDENTIFIER ":" expression ( "," IDENTIFIER ":" primary )* ( "," )* "}"
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
