import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import RuntimeError from '../RuntimeError';
import Token, { Literal } from '../Token';

export default class Push extends Callable {
  arity() {
    return Infinity;
  }

  call(_interpreter: Interpreter, args: Literal[], token: Token): Literal {
    if (!Array.isArray(args[0]))
      throw new RuntimeError(token, 'First parameter should be an array.');
    const [array, ...rest] = args;
    array.push(...rest);
    return null;
  }
}
