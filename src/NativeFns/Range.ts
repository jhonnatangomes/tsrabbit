import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import RuntimeError from '../RuntimeError';
import Token, { Literal } from '../Token';

export default class Range extends Callable {
  arity() {
    return 1;
  }

  call(_interpreter: Interpreter, args: Literal[], token: Token): Literal {
    if (typeof args[0] !== 'number' && !Number.isInteger(args[0])) {
      throw new RuntimeError(
        token,
        'Range argument should be an integer number.'
      );
    }
    return new Array(args[0]).fill('').map((_, i) => i);
  }
}
