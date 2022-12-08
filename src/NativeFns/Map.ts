import { Callable } from '../Callable';
import Interpreter from '../Interpreter';
import RabbitFunction from '../RabbitFunction';
import RuntimeError from '../RuntimeError';
import Token, { Literal } from '../Token';

export default class Map extends Callable {
  arity() {
    return 2;
  }

  call(interpreter: Interpreter, args: Literal[], token: Token): Literal {
    if (!Array.isArray(args[0]))
      throw new RuntimeError(token, 'First parameter should be an array.');
    if (!(args[1] instanceof RabbitFunction)) {
      throw new RuntimeError(token, 'Second parameter should be a function.');
    }
    const [array, fn] = args;
    return array.map((v) => fn.call(interpreter, [v]));
  }
}
