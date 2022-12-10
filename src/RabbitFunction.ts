import { Callable } from './Callable';
import Environment from './Environment';
import { LambdaExpr } from './Expr';
import Interpreter from './Interpreter';
import Return from './Return';
import { FunctionStmt } from './Stmt';
import { Literal } from './Token';

export default class RabbitFunction extends Callable {
  declaration: FunctionStmt | LambdaExpr;
  private closure: Environment;
  constructor(declaration: FunctionStmt | LambdaExpr, closure: Environment) {
    super();
    this.closure = closure;
    this.declaration = declaration;
  }

  call(interpreter: Interpreter, args: Literal[]) {
    const environment = new Environment(this.closure);
    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]);
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (error) {
      if ('value' in (error as object)) {
        return (error as Return).value;
      }
      throw error;
    }
    return null;
  }

  arity() {
    return this.declaration.params.length;
  }
}
