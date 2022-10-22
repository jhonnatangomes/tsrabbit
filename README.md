# TsRabbit

This is a typescript implementation of the tree-walk interpreter of the Lox programming language from the excellent book [Crafting Interpreters], by Robert Nystrom. I intend to add my own features to the language. This is just an exercise in learning, so I won't bother that much to make it as performant as it can be. Once I think that the language is finished, I can start working on improving it performance-wise. I really like rabbits, hence the name of the language.

[crafting interpreters]: https://craftinginterpreters.com/

## Grammar

This space will be used to specify Rabbit's grammar. It will be updated as I work on it. Without further ado, that is Rabbit's grammar so far:

```
expression -> literal
           | unary
           | binary
           | grouping ;
literal    -> NUMBER | STRING | "true" | "false" | "nil" ;
grouping   -> "(" expression ")" ;
unary      -> ( "-" | "!" ) expression ;
binary     -> expression operator expression ;
operator   -> "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/" | "++" | "--" | "+=" | "-=" | "*=" | "/=";
```
