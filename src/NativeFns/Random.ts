import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import RuntimeError from '../RuntimeError';
import { Literal } from '../Token';

export default class Random extends Callable {
  arity() {
    return 2;
  }

  call(_interpreter: Interpreter, args: number[]): Literal {
    if (args[1] < args[0]) {
      return -1;
    }
    const [a, b] = args;
    return Math.round(Math.random() * (b - a) + a);
  }
}
