# Rabbit

This is a typescript implementation of the tree-walk interpreter of the Lox programming language from the excellent book [Crafting Interpreters], by Robert Nystrom. It started out as the same language from the book, but I eventually added some features I wanted. I decided to not implement classes in the language, because I wanted it to be purely functional. This decision also guided me on the creation of some features, like the implementation of a pipe operator and lambda expressions.

[crafting interpreters]: https://craftinginterpreters.com/

## The language

I am a huge fan of rabbits, hence the name of the language. Rabbit is dynamically typed and has the following data types: strings, numbers, booleans, arrays, hashes and the nil value.

Variables can be declared with the var keyword:

```
// This is a comment.
var myNum = 5;
var myString = "hello"; //String literals are built with ", not '
var myBool = false;
var myArray = [1, 2, 3];
var myHash = {name: "Jhonn", age: 23};
```

All statements in the language must end with an obligatory `;`. Function declaration is done via the fun keyword:

```
fun myFunction() {
    return "Hello World";
}
fun sum(a, b) {
    return a + b;
}
```

Functions can also be declared with a lambda expression:

```
// Arguments are put inside the || and separated by commas.
// An arrow operator is necessary after the arguments.
// An expression after the arrow is an implicit return.
var multiply = |a, b| => a * b;
var multiply2 = |a, b| => {
    return a * b;
}
```

The language also supports a pipe operator to make nested function calls more readable:

```
// The | operator takes the result from the previous
// function call and use it as the first argument
// in the second function call.
map([1, 2, 3, 4, 5, 6], |x| => x * 3) | filter(|x| => x >= 12);

// The above is equivalent to
filter(map([1, 2, 3, 4, 5, 6], |x| => x*3), |x| => x >= 12);
```

Conditional branching is the done via the if/else keywords:

```
if (condition) {
  doThis();
} else {
  doThat();
}
```

Loops can be done in three ways: with while loops, for loops and for in loops.

```
while (condition){
  keepGoing();
}
for (var i = 0; i < num; i = i + 1){ // It doesn't yet support i++ constructs.
  keepGoing();
}
for v, i in [1, 2, 3] { // v is the current array element and i is its index.
  print(v, i);
}
for i in range(5) { // The range function returns an array from 0 to n.
  print(i);
}
```

The interpreter can be started in REPL mode by just running the executable with `tsrabbit` or it can interpret a file given to it as argument. It also suports being open with two flags, namely `--print-tokens` and `--print-ast` to print the tokens and the ast respectively.

## Standard Library

### Map

Accepts two parameters, an array and a function name. Returns a new array with the values from the old array mapped to the new one via the supplied function.

```
map([1, 2, 3], |x| => x * 2); // [2, 4, 6]
```

### Filter

Accepts two parameters, an array and a function name. Returns a new array with the values from the first array that satisfy the predicate (the supplied function).

```
filter([1, 2, 3, 4], |x| => x >= 3); // [3, 4]
```

### Reduce

Accepts two parameters, an array and a function name. Returns a value that is constructed by using the values returned from the supplied function. This function takes 2 parameters, the accumulated value from the previous calls and the current array element. It starts iterating from the second element in the array and it uses the first array element in the first accumulated argument.

```
reduce([1, 2, 3, 4], |acc, curr| => acc + curr); // 10
```

Note: All three functions above (map, filter and reduce) accept a lambda with an extra parameter. That parameter is the current index of the array element that is being iterated.

```
map([1, 2, 3], |x, i| => x * i); // [0, 2, 6]
```

### Slice

Accepts three arguments, and array and two integer numbers, start and end. Slices the array between start and end (not inclusive) and returns this slice as a new array.

```
slice([1, 2, 3, 4], 0, 2); // [1, 2]
```

### Print

Accepts any number of arguments and prints them.

```
print(a, b, c);
```

### Clock

Starts a clock the first time it is called, then on the second time it is called, returns the elapsed time in milisseconds since the first clock call.

```
clock();
doSomeBigStuff();
print(clock());
```

### Random

Accepts two numerical arguments and returns a random integer number between the two arguments specified.

```
random(5, 10);
```

### Length

Returns the length of an array.

```
length([1, 2, 3, 4]); // 4
```

### Push

Appends any number of elements to the end of an array.

```
var arr = [1, 2, 3];
push(arr, 4, 5);
print(arr); // [1, 2, 3, 4, 5];
```

### Range

Accepts a numerical integer argument n and returns an array from 0 to n-1.

```
print(range(5)); // [0, 1, 2, 3, 4]
```

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
indexedAccess  -> primary ( "[" expression "]" ) *
call           -> primary ( "(" arguments? ")" ) * ("|" call) * ;
arguments      -> expression ( "," expression ) *;
binary         -> expression operator expression ;
operator       -> "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/";
primary        -> NUMBER | STRING | "true" | "false" | "nil" | array | hash | lambda
               | "(" expression ")"
               | IDENTIFIER
               | indexedAccess ;
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
