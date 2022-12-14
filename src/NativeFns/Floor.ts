import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import RuntimeError from '../RuntimeError';
import Token, { Literal } from '../Token';

export default class Floor extends Callable {
  arity() {
    return 1;
  }

  call(_interpreter: Interpreter, args: number[], token: Token): Literal {
    if (typeof args[0] !== 'number') {
      throw new RuntimeError(token, 'Argument should be a number.');
    }
    return Math.floor(args[0]);
  }
}
