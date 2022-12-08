import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import RuntimeError from '../RuntimeError';
import Token, { Literal } from '../Token';

export default class Length extends Callable {
  arity() {
    return 1;
  }

  call(_interpreter: Interpreter, args: Literal[], token: Token): Literal {
    if (!Array.isArray(args[0]))
      throw new RuntimeError(token, 'Parameter should be an array.');
    return args[0].length;
  }
}
