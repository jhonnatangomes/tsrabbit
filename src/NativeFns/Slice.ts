import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import RuntimeError from '../RuntimeError';
import Token, { Literal } from '../Token';

export default class Slice extends Callable {
  arity() {
    return 3;
  }

  call(_interpreter: Interpreter, args: Literal[], token: Token): Literal {
    if (!Array.isArray(args[0]))
      throw new RuntimeError(token, 'First parameter should be an array.');
    if (typeof args[1] !== 'number' || !Number.isInteger(args[1])) {
      throw new RuntimeError(token, 'Second parameter should be an integer.');
    }
    if (typeof args[2] !== 'number' || Number.isInteger(args[2])) {
      throw new RuntimeError(token, 'Third parameter should be an integer.');
    }
    const [array, start, end] = args;
    return array.slice(start, end);
  }
}
