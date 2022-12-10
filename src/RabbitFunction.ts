import { Callable } from './Callable';
import Environment from './Environment';
import Interpreter from './Interpreter';
import Return from './Return';
import { FunctionStmt } from './Stmt';
import { Literal } from './Token';

export default class RabbitFunction extends Callable {
  declaration: FunctionStmt;
  private closure: Environment;
  constructor(declaration: FunctionStmt, closure: Environment) {
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
    } catch (returnValue) {
      return (returnValue as Return).value;
    }
    return null;
  }

  arity() {
    return this.declaration.params.length;
  }
}
