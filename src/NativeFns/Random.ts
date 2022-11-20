import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import RuntimeError from '../RuntimeError';
import Token, { Literal } from '../Token';

export default class Random extends Callable {
  arity() {
    return 2;
  }

  call(_interpreter: Interpreter, args: number[], token: Token): Literal {
    if (args[1] < args[0]) {
      throw new RuntimeError(
        token,
        'First number should be smaller than second number.'
      );
    }
    if (typeof args[0] !== 'number' || typeof args[1] !== 'number') {
      throw new RuntimeError(token, 'Parameters should be numbers.');
    }
    const [a, b] = args;
    return Math.round(Math.random() * (b - a) + a);
  }
}
